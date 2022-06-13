
BasicGame.Zeno = function (game) {

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

BasicGame.Zeno.prototype = {

  ZENO_STATE: {
    IDLE: "IDLE",
    RUNNING: "RUNNING",
    CELEBRATING: "CELEBRATING",
    UNCELEBRATING: "UNCELEBRATING",
    FREE: "FREE"
  },

  MAX_INPUT_DELAY: 200,
  ZENO_SPEED: 0.2,
  timeSinceInput: 100000,
  racing: false,

  create: function () {

    // GENERAL SETUP

    SCALE = 4;
    // document.body.style.backgroundColor = '#222222';
    this.stage.backgroundColor = '#DDAADD';

    // SPRITES

    this.zeno = this.addSprite(16*SCALE,58*SCALE,'zeno/running/running_1');
    this.zeno.anchor.x = 0.5;
    this.flag = this.addSprite(180*SCALE,49*SCALE,'zeno/flag');
    this.ground = this.addSprite(0,0,'zeno/ground');

    this.zeno.state = this.ZENO_STATE.IDLE;

    // ANIMATION

    this.setupAnimations();

    this.zeno.animations.play('idle');

    // SFX

    this.celebrateSFX = this.game.add.audio('victorySFX');
    this.uncelebrateSFX = this.game.add.audio('swoopDownSFX');

    // TEXTS

    var instructionsString = "RAPIDLY " + INPUT_WORD + " TO RUN THE RACE!";

    var instructionsStyle = { font: FONT_SIZE_SMALL + "px commodore_64_pixelizedregular", fill: "#000000", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.instructionsText = this.game.add.text(this.game.width/2, 20*SCALE, instructionsString, instructionsStyle);
    this.instructionsText.lineSpacing = -8;
    this.instructionsText.anchor.x = 0.5;

    var markerStyle = { font: FONT_SIZE_EXTRA_SMALL + "px commodore_64_pixelizedregular", fill: "#FFFFFF", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.startText = this.game.add.text(15*SCALE, 82*SCALE, "0m", markerStyle);
    this.halfwayText = this.game.add.text(95*SCALE, 82*SCALE, "50m", markerStyle);
    this.finishText = this.game.add.text(180*SCALE, 82*SCALE, "100m", markerStyle);

    // INPUT

    this.input.onDown.add(this.onDown,this);

  },

  update: function () {

    this.timeSinceInput += this.game.time.elapsed;
    this.handleZeno();
    if (this.zeno.x >= 50*SCALE) {
      this.instructionsText.visible = false;
    }

  },

  handleZeno: function () {

    this.racing = (this.timeSinceInput < this.MAX_INPUT_DELAY);

    switch (this.zeno.state) {
      case this.ZENO_STATE.IDLE:
      if (this.racing) {
        this.zeno.animations.play('run');
        this.zeno.state = this.ZENO_STATE.RUNNING;
      }
      break;

      case this.ZENO_STATE.RUNNING:
      if (!this.racing) {
        this.zeno.animations.play('idle');
        this.zeno.state = this.ZENO_STATE.IDLE;
      }
      else {
        this.zeno.x += this.ZENO_SPEED*SCALE;
      }

      if (this.zeno.x >= this.flag.x + 50) {
        this.zeno.animations.play("idle");
        this.zeno.state = this.ZENO_STATE.CELEBRATING;
        this.game.time.events.add(Phaser.Timer.SECOND * 2,this.celebrate, this);
      }
      break;

      case this.ZENO_STATE.CELEBRATING:

      break;

      case this.ZENO_STATE.UNCELEBRATING:

      break;

      case this.ZENO_STATE.FREE:
      if (Math.abs(this.destination - this.zeno.x) < 10) {
        this.zeno.animations.play("idle");
        return;
      }

      if (this.destination < this.zeno.x) {
        this.zeno.x -= this.ZENO_SPEED*SCALE;
      }
      else {
        this.zeno.x += this.ZENO_SPEED*SCALE;
      }
      break;
    }
  },

  celebrate: function () {
    this.zeno.animations.play("celebrate");
    this.celebrateSFX.play();
    this.zeno.animations.currentAnim.onComplete.addOnce(function () {
      this.game.time.events.add(Phaser.Timer.SECOND * 2,this.uncelebrate, this);
      this.zeno.state = this.ZENO_STATE.UNCELEBRATING;
    },this)
  },

  uncelebrate: function () {
    this.zeno.animations.play("uncelebrate");
    this.uncelebrateSFX.play();
    this.zeno.animations.currentAnim.onComplete.addOnce(function () {
      this.zeno.animations.play("idle");
      this.destination = this.zeno.x;
      this.zeno.state = this.ZENO_STATE.FREE;
    },this);
  },

  onDown: function (pointer) {
    switch (this.zeno.state) {
      case this.ZENO_STATE.IDLE:
      case this.ZENO_STATE.RUNNING:
      this.timeSinceInput = 0;
      break;

      case this.ZENO_STATE.CELEBRATING:

      break;

      case this.ZENO_STATE.UNCELEBRATING:

      break;

      case this.ZENO_STATE.FREE:
      this.destination = pointer.x;
      if (this.destination < this.zeno.x) {
        this.zeno.scale.x = -Math.abs(this.zeno.scale.x);
      }
      else {
        this.zeno.scale.x = Math.abs(this.zeno.scale.x);
      }
      this.zeno.animations.play("run");
      break;
    }
  },

  addSprite: function (x, y, name) {
    var newSprite = this.add.sprite(0, 0, 'atlas', name + '.png');
    newSprite.scale.x *= SCALE; newSprite.scale.y *= SCALE;
    newSprite.x = x; newSprite.y = y;
    return newSprite;
  },

  setupAnimations: function () {
    var idleAnimArray = this.getAnimationArray('zeno/running/running_',[4,4]);
    this.zeno.animations.add('idle',idleAnimArray,5);

    var runAnimArray = this.getAnimationArray('zeno/running/running_',[1,2,3]);
    this.zeno.animations.add('run',runAnimArray,5,true);

    var celebrateAnimArray = this.getAnimationArray('zeno/running/running_',[4,5,6,7,8]);
    this.zeno.animations.add('celebrate',celebrateAnimArray,5);

    var uncelebrateAnimArray = this.getAnimationArray('zeno/running/running_',[8,7,6,5,4]);
    this.zeno.animations.add('uncelebrate',uncelebrateAnimArray,5);
  },

  getAnimationArray: function (name, frames) {
    for (var i = 0; i < frames.length; i++) {
      frames[i] = name + frames[i] + '.png';
    }
    return frames;
  },
};
