
BasicGame.Sisyphus = function (game) {

  //	When a State is added to Phaser it automatically has the following properties set on it, even if they already exist:

  this.game;		//	a reference to the currently running game
  this.add;		//	used to add sprites, text, groups, etc
  this.camera;	//	a reference to the game camera
  this.cache;		//	the game cache
  this.input;		//	the global input manager (you can access this.input.keyboard, this.input.mouse, as well from it)
  this.load;		//	for preloading assets
  this.math;		//	lots of useful common math operations
  this.sound;		//	the sound manager - add a sound, play one, set-up markers, etc
  this.stage;		//	the game stage
  this.time;		//	the clock
  this.tweens;	//	the tween manager
  this.world;		//	the game world
  this.particles;	//	the particle manager
  this.physics;	//	the physics manager
  this.rnd;		//	the repeatable random number generator

  //	You can use any of these from any function within this State.
  //	But do consider them as being 'reserved words', i.e. don't create a property for your own game called "world" or you'll over-write the world reference.

};

BasicGame.Sisyphus.prototype = {

  STATE: {
    PUSH: "PUSH",
    REVERSE_PUSH: "REVERSE_PUSH",
    PUSH_TOP: "PUSH_TOP",
    FREE: "FREE",
  },

  PUSH_FLAT_END: 52,
  REVERSE_PUSH_END_FRAME: 76,
  PUSH_HILL_TOP_FRAME: 111,

  CLIFF_X: 190*4, // Cut-off X to remove control and allow Sisyphus to sit on the cliff edge

  MAX_INPUT_DELAY: 200,
  timeSinceInput: 10000,
  enoughInput: false,
  pushEnabled: true,
  state: null,

  spritesJSON: null,
  destination: 0,
  SISYPHUS_SPEED: 0.2,

  CAMERA_PAN_SPEED: 1,
  CAMERA_PAN_UP_FRAME: 90,
  CAMERA_PAN_DOWN_FRAME: 38,
  CAMERA_PAN_MIN_X: 130*4,
  CAMERA_PAN_MAX_X: 150*4,
  cameraPan: {
    x: 0,
    y: 0
  },

  create: function () {
    // GENERAL SETUP

    SCALE = 4;
    // document.body.style.backgroundColor = '#222222';
    this.stage.backgroundColor = '#AAAAFF';
    this.game.world.setBounds(0,0*SCALE,240*SCALE,130*SCALE);
    this.game.camera.y = 10000;
    this.game.camera.x = 0;
    this.spritesJSON = this.game.cache.getJSON('sprites');

    // SPRITES

    this.hill = this.addSprite(0,0,'sisyphus/hill');
    this.hill.y = this.game.world.height - this.hill.height;
    this.sisyphus = this.addSprite(0,0,'sisyphus/sisyphus/sisyphus_1');
    this.sisyphus.y = this.game.world.height - this.sisyphus.height;
    this.destination = -1;

    // ANIMATION

    this.setupAnimations();
    this.pushFrom(0);
    this.sisyphus.animations.paused = true;

    // SOUNDS

    this.boulderSFX = this.game.add.audio('swoopDownSFX');


    // TEXTS

    var instructionsStyle = { font: FONT_SIZE_SMALL + "px commodore_64_pixelizedregular", fill: "#000000", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    var instructionsString = "RAPIDLY " + INPUT_WORD + " TO PUSH THE BOULDER UP THE HILL!";

    this.instructionsText = this.game.add.text(20*SCALE, 50*SCALE, instructionsString, instructionsStyle);
    this.instructionsText.lineSpacing = -8;

    var failuresStyle = { font: FONT_SIZE_BIG + "px commodore_64_pixelizedregular", fill: "#FFFFFF", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.failuresText = this.game.add.text(105*SCALE, 115*SCALE, '', failuresStyle);
    this.failuresText.rotation = -Math.PI/4;

    // TRACKING

    this.failures = 0;

    this.updateTexts();

    // INPUT

    this.input.onDown.add(this.onDown,this);
  },

  update: function () {
    this.timeSinceInput += this.game.time.elapsed;
    this.handleSisyphus();
    this.handleCamera();
  },

  handleCamera: function () {
    this.game.camera.x += this.CAMERA_PAN_SPEED * this.cameraPan.x;
    this.game.camera.y += this.CAMERA_PAN_SPEED * this.cameraPan.y;
  },

  handleSisyphus: function () {
    this.enoughInput = (this.pushEnabled && this.timeSinceInput < this.MAX_INPUT_DELAY);
    // this.enoughInput = (this.pushEnabled && this.game.input.activePointer.isDown);

    switch (this.state) {
      case this.STATE.PUSH:

      if (this.getCurrentLocalFrame(this.sisyphus) >= 74) {
        this.instructionsText.visible = false;
      }

      if (this.enoughInput) {
        if (this.sisyphus.animations.paused) {
          this.sisyphus.animations.paused = false;
        }
      }
      else {
        if (this.getCurrentLocalFrame(this.sisyphus) < this.PUSH_FLAT_END) {
          if (!this.sisyphus.animations.paused) {
            this.sisyphus.animations.paused = true;
          }
        }
        else {
          var reverseFrame = this.getReverseFrameIndex(this.sisyphus);
          this.reverseFrom(reverseFrame);
        }
      }

      break;

      case this.STATE.REVERSE_PUSH:

      if (this.enoughInput) {
        var reverseFrame = this.getReverseFrameIndex(this.sisyphus);
        this.pushFrom(reverseFrame);
      }

      break;

      case this.STATE.PUSH_TOP:

      break;

      case this.STATE.FREE:

      {
        var frame = this.getCurrentLocalFrame(this.sisyphus);
        var animName = this.sisyphus.animations.currentAnim.name;

        if (animName == 'free_right') {
          if (this.getSisyphusX() > this.CAMERA_PAN_MIN_X) {
            this.cameraPan.x = 1;
            this.cameraPan.y = -1;
          }
          else {
            this.cameraPan.x = 0;
            this.cameraPan.y = 0;
          }
        }
        else if (animName == 'free_left') {
          if (this.getSisyphusX() < this.CAMERA_PAN_MAX_X) {
            this.cameraPan.x = -1;
            this.cameraPan.y = 1;
          }
          else {
            this.cameraPan.x = 0;
            this.cameraPan.y = 0;
          }
        }

        if (animName == 'free_left') {
          if (this.getSisyphusX() <= this.destination) {
            this.sisyphus.animations.play('free_left_idle');
            this.sisyphus.animations.currentAnim.frame = frame;
            this.sisyphus.animations.paused = true;
          }
        }
        else if (animName == 'free_right'){
          if (this.getSisyphusX() >= this.destination && this.getSisyphusX() < this.CLIFF_X) {
            this.sisyphus.animations.play('free_right_idle');
            this.sisyphus.animations.currentAnim.frame = frame;
            this.sisyphus.animations.paused = true;
          }
        }

        break;
      }

    }
  },

  reverseFrom: function (frame) {
    this.state = this.STATE.REVERSE_PUSH;
    this.cameraPan.x = 0; this.cameraPan.y = 0;
    this.sisyphus.animations.play('reverse_push');
    this.sisyphus.animations.currentAnim.frame = frame;
    if (this.sisyphus.animations.currentAnim.onUpdate) this.sisyphus.animations.currentAnim.onUpdate.removeAll();
    this.sisyphus.animations.currentAnim.enableUpdate = true;
    this.sisyphus.animations.currentAnim.onUpdate.add(function() {
      var frame = this.getCurrentLocalFrame(this.sisyphus);
      if (frame >= this.CAMERA_PAN_DOWN_FRAME) {
        this.cameraPan.x = -1;
        this.cameraPan.y = 1;
      }
      if (frame >= this.REVERSE_PUSH_END_FRAME) {
        var reverseFrame = this.getReverseFrameIndex(this.sisyphus);
        this.pushFrom(reverseFrame);
        if (!this.sisyphus.animations.paused) this.sisyphus.animations.paused = true;
      }
    },this);
  },

  pushFrom: function (frame) {
    this.state = this.STATE.PUSH;
    this.cameraPan.x = 0; this.cameraPan.y = 0;
    this.sisyphus.animations.play('push');
    this.sisyphus.animations.currentAnim.frame = frame;
    if (this.sisyphus.animations.currentAnim.onUpdate) this.sisyphus.animations.currentAnim.onUpdate.removeAll();
    this.sisyphus.animations.currentAnim.enableUpdate = true;
    this.sisyphus.animations.currentAnim.onUpdate.add(function () {
      var frame = this.getCurrentLocalFrame(this.sisyphus);
      if (frame >= this.CAMERA_PAN_UP_FRAME) {
        this.cameraPan.x = 1;
        this.cameraPan.y = -1;
      }
      if (frame >= this.PUSH_HILL_TOP_FRAME) {
        this.pushEnabled = false;
        this.state = this.STATE.PUSH_TOP;
      }
      if (frame == 118) {
        this.boulderSFX.play();
      }
    },this);
    this.sisyphus.animations.currentAnim.onComplete.add(function () {
      this.state = this.STATE.FREE;
      // this.sisyphus.animations.play('free_right_idle');
      // this.sisyphus.animations.currentAnim.frame = 118;
      // this.sisyphus.animations.paused = true;
    },this);
  },


  updateTexts: function () {
    this.failuresText.text = "FAILURES: " + this.failures;
  },

  onDown: function (pointer) {

    this.timeSinceInput = 0;

    switch (this.state) {

      case this.STATE.FREE:

      this.destination = pointer.worldX - 3*SCALE;
      if (Math.abs(this.destination - this.getSisyphusX()) < 10) {
        return;
      }

      var frame = this.getCurrentLocalFrame(this.sisyphus);
      var animName = this.sisyphus.animations.currentAnim.name;

      if (this.destination < this.getSisyphusX()) {
        if (animName == 'push') {
          frame = 10;
        }
        else if (animName == 'free_right' || animName == 'free_right_idle') {
          frame = this.getReverseFrameIndex(this.sisyphus);
        }
        this.sisyphus.animations.play('free_left');
        this.sisyphus.animations.paused = false;
        this.sisyphus.animations.currentAnim.frame = frame;
      }
      else if (this.destination > this.getSisyphusX()) {
        if (animName == 'push') {
          frame = 118;
        }
        else if (animName == 'free_left' || animName == 'free_left_idle') {
          frame = this.getReverseFrameIndex(this.sisyphus);
        }
        this.sisyphus.animations.play('free_right');
        this.sisyphus.animations.paused = false;
        this.sisyphus.animations.currentAnim.frame = frame;
      }

    }
  },

  getSisyphusX: function () {
    var frame = this.sisyphus.animations.currentAnim.currentFrame.name;
    return this.spritesJSON.frames[frame].spriteSourceSize.x * SCALE;
  },

  addSprite: function (x, y, name) {
    var newSprite = this.add.sprite(0, 0, 'atlas', name + '.png');
    newSprite.scale.x *= SCALE; newSprite.scale.y *= SCALE;
    newSprite.x = x; newSprite.y = y;
    return newSprite;
  },

  setupAnimations: function () {
    var FRAME_RATE = 5;

    var sisyphusPushAnimArray = this.getAnimationArrayByRange('sisyphus/sisyphus/sisyphus_',1,128)
    this.sisyphus.animations.add('push',sisyphusPushAnimArray,FRAME_RATE);

    var sisyphusReversePushAnimArray = this.getAnimationArrayByRange('sisyphus/sisyphus/sisyphus_',128,1)
    this.sisyphus.animations.add('reverse_push',sisyphusReversePushAnimArray,FRAME_RATE*2);

    var sisyphusPostBoulderLeftAnimArray = this.getAnimationArrayByRange('sisyphus/sisyphus_post_boulder_left/sisyphus_post_boulder_left_',128,1);
    this.sisyphus.animations.add('free_left',sisyphusPostBoulderLeftAnimArray,FRAME_RATE*1.5);

    var sisyphusPostBoulderRightAnimArray = this.getAnimationArrayByRange('sisyphus/sisyphus_post_boulder_right/sisyphus_post_boulder_right_',1,128);
    this.sisyphus.animations.add('free_right',sisyphusPostBoulderRightAnimArray,FRAME_RATE*1.5);

    var sisyphusPostBoulderLeftIdleAnimArray = this.getAnimationArrayByRange('sisyphus/sisyphus_post_boulder_left_idle/sisyphus_post_boulder_left_idle_',128,1);
    this.sisyphus.animations.add('free_left_idle',sisyphusPostBoulderLeftIdleAnimArray,FRAME_RATE*1.5);

    var sisyphusPostBoulderRightIdleAnimArray = this.getAnimationArrayByRange('sisyphus/sisyphus_post_boulder_right_idle/sisyphus_post_boulder_right_idle_',1,128);
    this.sisyphus.animations.add('free_right_idle',sisyphusPostBoulderRightIdleAnimArray,FRAME_RATE*1.5);

  },

  getAnimationArray: function (name, frames) {
    for (var i = 0; i < frames.length; i++) {
      frames[i] = name + frames[i] + '.png';
    }
    return frames;
  },

  getAnimationArrayByRange: function (name, start, end) {
    var frames = [];
    for (var i = 0; i <= Math.abs(end - start); i++) {
      if (start < end) {
        frames.push(name + (start + i) + '.png');
      }
      else {
        frames.push(name + (start - i) + '.png');
      }
    }
    return frames;
  },

  getCurrentLocalFrame: function (sprite) {
    var currentLocalFrameInAnimation = sprite.animations.currentAnim._frames.indexOf(sprite.animations.currentAnim.frame);
    return currentLocalFrameInAnimation;
  },

  getReverseFrameIndex: function (sprite) {
    var currentLocalFrameInAnimation = sprite.animations.currentAnim._frames.indexOf(sprite.animations.currentAnim.frame);
    var reverseFrameIndex = (sprite.animations.currentAnim.frameTotal - currentLocalFrameInAnimation - 1);
    return reverseFrameIndex;
  },
};
