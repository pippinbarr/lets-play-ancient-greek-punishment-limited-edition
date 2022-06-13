
BasicGame.Danaids = function (game) {

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

BasicGame.Danaids.prototype = {
  DANAID_STATE: {
    IDLE_WITH_BUCKET: "IDLE_WITH_BUCKET",
    WALK_TO_FILL: "WALK_TO_FILL",
    FILLING_BUCKET: "FILLING_BUCKET",
    LOWERING_BUCKET: "LOWERING_BUCKET",
    WALK_TO_POUR: "WALK_TO_POUR",
    FILLING_BATH: "FILLING_BATH",
    FREE: "FREE",
    GETTING_INTO_BATH: "GETTING_INTO_BATH",
    GETTING_OUT_OF_BATH: "GETTING_OUT_OF_BATH",
    IN_BATH: "IN_BATH",
  },

  TAP_STOP_X: 12,
  BATH_STOP_X: 160.5,
  FILL_TIME: 2000,
  fillingTime: 0,
  bucketFull: false,
  bathFull: 0,
  MAX_INPUT_DELAY: 200,
  DANAID_SPEED: 0.3,
  timeSinceInput: 100000,
  enoughInput: false,

  create: function () {

    // GENERAL SETUP

    SCALE = 4;
    // document.body.style.backgroundColor = '#222222';
    this.stage.backgroundColor = '#DDDDAA';

    // SPRITES

    this.tap = this.addSprite(0*SCALE,61*SCALE,'danaids/tap/tap_1');

    this.danaid = this.addSprite(50*SCALE,60*SCALE,'danaids/danaid/danaid_1');
    this.danaid.scale.x = -Math.abs(this.danaid.scale.x);
    this.danaid.anchor.x = 0.33;
    this.danaid.destination = -1;

    this.bath = this.addSprite(170*SCALE,67*SCALE,'danaids/bath');
    this.bucket = this.addSprite(165*SCALE,73*SCALE,'danaids/bucket');
    this.bucket.visible = false;

    this.ground = this.addSprite(0,0,'danaids/ground');

    // ANIMATIONS

    this.setupAnimations();

    this.danaid.animations.play('idle_with_bucket');
    this.danaid.destination = this.danaid.x;
    // this.danaid.animations.play('entering_bath');
    this.tap.animations.play('flowing');

    // SFX

    this.pointSFX = this.game.add.audio('peckSFX');
    this.fillSFX = this.game.add.audio('swoopUpSFX');

    // TEXTS

    var instructionsString = "RAPIDLY " + INPUT_WORD + " TO FILL YOUR BUCKET AND THEN FILL THE BATH TO WASH AWAY YOUR SINS!";

    var instructionsStyle = { font: FONT_SIZE_SMALL + "px commodore_64_pixelizedregular", fill: "#000000", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.instructionsText = this.game.add.text(this.game.width/2, 20*SCALE, instructionsString, instructionsStyle);
    this.instructionsText.lineSpacing = -8;
    // this.instructionsText.anchor.x = 0.5;

    var bathStyle = { font: FONT_SIZE_SMALL + "px commodore_64_pixelizedregular", fill: "#FFFFFF", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.bathText = this.game.add.text(118*SCALE, 87*SCALE, '', bathStyle);

    // TRACKING

    this.danaid.state = this.DANAID_STATE.IDLE_WITH_BUCKET;
    // this.danaid.state = this.DANAID_STATE.FAKE;

    this.updateTexts();

    // INPUT

    this.input.onDown.add(this.onDown,this);

  },

  update: function () {
    this.timeSinceInput += this.game.time.elapsed;
    this.handleDanaid();
  },

  updateTexts: function () {
    this.bathText.text = "BATH FULL: " + this.bathFull + "%";
  },

  handleDanaid: function () {

    // console.log(this.danaid.state);

    this.enoughInput = (this.timeSinceInput < this.MAX_INPUT_DELAY);

    // this.enoughInput = this.game.input.activePointer.isDown;

    switch (this.danaid.state) {
      case this.DANAID_STATE.IDLE_WITH_BUCKET:

      if (this.bucketFull) {
        this.danaid.scale.x = Math.abs(this.danaid.scale.x);
      }
      else {
        this.danaid.scale.x = -Math.abs(this.danaid.scale.x);
      }

      if (this.enoughInput) {
        if (this.fillingTime != 0) {
          this.danaid.state = this.DANAID_STATE.FILLING_BUCKET;
          this.danaid.animations.play('fill_bucket');
          this.tap.animations.play('fill_bucket');
        }
        else {
          this.danaid.animations.play('walk_with_bucket');
          if (this.bucketFull) {
            this.danaid.state = this.DANAID_STATE.WALK_TO_POUR;
          }
          else {
            this.danaid.state = this.DANAID_STATE.WALK_TO_FILL;
          }
        }
      }

      break;

      case this.DANAID_STATE.WALK_TO_FILL:

      this.danaid.scale.x = -Math.abs(this.danaid.scale.x);
      if (!this.enoughInput) {
        this.idle();
      }
      else {
        this.danaid.x -= this.DANAID_SPEED*SCALE;
        if (this.danaid.x <= this.TAP_STOP_X*SCALE) {
          this.danaid.state = this.DANAID_STATE.FILLING_BUCKET;
          this.danaid.animations.play('fill_bucket');
          this.tap.animations.play('fill_bucket');
        }
      }

      break;

      case this.DANAID_STATE.FILLING_BUCKET:

      this.fillingTime += this.game.time.elapsed;
      this.bucketFull = (this.fillingTime >= this.FILL_TIME);
      if (!this.enoughInput) {
        this.idle();
        this.tap.animations.play('postBucket');
        this.tap.animations.currentAnim.onComplete.addOnce(function (){
          this.tap.animations.play('flowing');
        },this);
      }
      else {
        this.danaid.animations.play('fill_bucket');
        this.tap.animations.play('fill_bucket');
      }

      if (this.bucketFull) {
        this.danaid.state = this.DANAID_STATE.LOWERING_BUCKET;
        this.danaid.animations.play('lowering_bucket');
        this.game.time.events.add(Phaser.Timer.SECOND * 1,function () {
          this.idle();
          this.danaid.x -= 4*SCALE;
        },this);
        this.tap.animations.play('postBucket');
        this.tap.animations.currentAnim.onComplete.addOnce(function (){
          this.tap.animations.play('flowing');
        },this);
        this.fillingTime = 0;
        return;
      }

      break;

      case this.DANAID_STATE.LOWERING_BUCKET:

      break

      case this.DANAID_STATE.WALK_TO_POUR:

      if (!this.enoughInput) {
        this.idle();
      }
      else {
        this.danaid.x += this.DANAID_SPEED*SCALE;
        if (this.danaid.x >= this.BATH_STOP_X*SCALE) {
          this.danaid.state = this.DANAID_STATE.FILLING_BATH;
          this.danaid.animations.play('pour');
          if (this.danaid.animations.currentAnim.onUpdate) this.danaid.animations.currentAnim.onUpdate.removeAll();
          this.danaid.animations.currentAnim.enableUpdate = true;
          this.danaid.animations.currentAnim.onUpdate.add(function () {
            if (this.getCurrentLocalFrame(this.danaid) == 5) {
              this.fillSFX.play();
            }
          },this);
          this.danaid.animations.currentAnim.onComplete.addOnce(function () {
            this.instructionsText.visible = false;
            this.bathFull += 20;
            this.pointSFX.play();
            this.updateTexts();
            this.game.time.events.add(Phaser.Timer.SECOND * 1,function () {
              if (this.bathFull < 100) {
                this.bucketFull = false;
                this.idle();
              }
              else {
                // The bath is full!!!!
                this.danaid.animations.play('put_down_bucket');
                this.danaid.animations.currentAnim.onComplete.addOnce(function () {
                  this.bucket.visible = true;
                  this.danaid.animations.play('idle_without_bucket');
                  this.danaid.state = this.DANAID_STATE.FREE;
                  this.danaid.destination = this.danaid.x;
                },this);
              }
            },this);
          },this)
        }
      }

      break;

      case this.DANAID_STATE.FILLING_BATH:

      break;

      case this.DANAID_STATE.FREE:

      if (Math.abs(this.danaid.destination - this.danaid.x) < 1) {
        if (this.danaid.destination == this.BATH_STOP_X*SCALE) {
          this.danaid.state = this.DANAID_STATE.GETTING_INTO_BATH;
          this.danaid.x = this.BATH_STOP_X*SCALE + 3.5*SCALE;
          this.danaid.y = this.bath.y - 27*SCALE;
          this.danaid.animations.play("enter_bath");
          this.danaid.animations.currentAnim.onComplete.addOnce(function () {
            this.danaid.state = this.DANAID_STATE.IN_BATH;
          },this)
        }
        else {
          this.danaid.animations.play("idle_without_bucket");
        }
      }
      else {
        if (this.danaid.destination < this.danaid.x) {
          this.danaid.x -= this.DANAID_SPEED*SCALE;
        }
        else {
          this.danaid.x += this.DANAID_SPEED*SCALE;
        }
        this.danaid.animations.play('walk_without_bucket');
      }

      break;

      case this.DANAID_STATE.GETTING_INTO_BATH:

      break;

      case this.DANAID_STATE.IN_BATH:
      if (this.danaid.destination < this.BATH_STOP_X*SCALE) {
        this.danaid.state = this.DANAID_STATE.GETTING_OUT_OF_BATH;
        this.danaid.play('exit_bath');
        this.danaid.animations.currentAnim.onComplete.addOnce(function () {
          this.danaid.state = this.DANAID_STATE.FREE;
          this.danaid.x = this.BATH_STOP_X*SCALE;
          this.danaid.y = 60*SCALE;
          this.danaid.animations.play('idle_without_bucket');
          if (this.danaid.destination < this.danaid.x) {
            this.danaid.scale.x = -Math.abs(this.danaid.scale.x);
          }
          else {
            this.danaid.scale.x = Math.abs(this.danaid.scale.x);
          }
        },this);
      }
      break;

      case this.DANAID_STATE.GETTING_OUT_OF_BATH:

      break;
    }

  },

  idle: function () {
    if (this.danaid.state != this.DANAID_STATE.FREE) {
      this.danaid.animations.play('idle_with_bucket');
      this.danaid.state = this.DANAID_STATE.IDLE_WITH_BUCKET;
    }
    else {
      this.danaid.animations.play('idle_without_bucket');
    }
  },

  onDown: function (pointer) {
    this.timeSinceInput = 0;

    switch (this.danaid.state) {
      case this.DANAID_STATE.IDLE_WITH_BUCKET:
      case this.DANAID_STATE.WALK_TO_FILL:
      case this.DANAID_STATE.FILLING_BUCKET:
      case this.DANAID_STATE.LOWERING_BUCKET:
      case this.DANAID_STATE.WALK_TO_POUR:
      case this.DANAID_STATE.FILLING_BATH:
      case this.DANAID_STATE.GETTING_INTO_BATH:
      case this.DANAID_STATE.IN_BATH:

      this.danaid.destination = pointer.x;

      break;

      case this.DANAID_STATE.FREE:
      if (Math.abs(pointer.x - this.danaid.x) < 10) {
        return;
      }

      this.danaid.destination = pointer.x;

      if (this.danaid.destination < this.danaid.x) {
        this.danaid.scale.x = -Math.abs(this.danaid.scale.x);
      }
      else {
        this.danaid.scale.x = Math.abs(this.danaid.scale.x);
      }

      if (this.danaid.destination < this.TAP_STOP_X*SCALE) {
        this.danaid.destination = this.TAP_STOP_X*SCALE;
      }
      if (this.danaid.destination > this.BATH_STOP_X*SCALE) {
        this.danaid.destination = this.BATH_STOP_X*SCALE;
      }

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
    var idleWithBucketAnimArray = this.getAnimationArray('danaids/danaid/danaid_',[4]);
    this.danaid.animations.add('idle_with_bucket',idleWithBucketAnimArray,5);

    var walkWithBucketAnimArray = this.getAnimationArray('danaids/danaid/danaid_',[1,2,3]);
    this.danaid.animations.add('walk_with_bucket',walkWithBucketAnimArray,5,true);

    var fillingBucketAnimArray = this.getAnimationArray('danaids/danaid/danaid_',[6]);
    this.danaid.animations.add('fill_bucket',fillingBucketAnimArray,5);

    var loweringBucketAnimArray = this.getAnimationArray('danaids/danaid/danaid_',[5]);
    this.danaid.animations.add('lowering_bucket',loweringBucketAnimArray,5);

    var pouringAnimArray = this.getAnimationArray('danaids/danaid/danaid_',[5,6,7,8,9,10,11,11,11,11,11,8,7,6,5]);
    this.danaid.animations.add('pour',pouringAnimArray,5,false);

    var puttingDownBucketAnimArray = this.getAnimationArray('danaids/danaid/danaid_',[12,13,14,15,16,17,18,19,20,21]);
    this.danaid.animations.add('put_down_bucket',puttingDownBucketAnimArray,5,false);

    var idleWithoutBucketAnimArray = this.getAnimationArray('danaids/danaid/danaid_',[22]);
    this.danaid.animations.add('idle_without_bucket',idleWithoutBucketAnimArray,5);

    var walkWithoutBucketAnimArray = this.getAnimationArray('danaids/danaid/danaid_',[23,24,25]);
    this.danaid.animations.add('walk_without_bucket',walkWithoutBucketAnimArray,5,true);

    var enteringBathAnimArray = this.getAnimationArray('danaids/entering_bath/entering_bath_',[1,2,3,4,5,6,7,8,9,10,11]);
    this.danaid.animations.add('enter_bath',enteringBathAnimArray,5);

    var exitingBathAnimArray = this.getAnimationArray('danaids/entering_bath/entering_bath_',[11,10,9,8,7,6,5,4,3,2,1]);
    this.danaid.animations.add('exit_bath',exitingBathAnimArray,5);

    var tapFlowingAnimArray = this.getAnimationArray('danaids/tap/tap_',[1,2,3]);
    this.tap.animations.add('flowing',tapFlowingAnimArray,5,true);

    var tapBucketAnimArray = this.getAnimationArray('danaids/tap/tap_',[4]);
    this.tap.animations.add('fill_bucket',tapBucketAnimArray,5,false);

    var tapPostBucketAnimArray = this.getAnimationArray('danaids/tap/tap_',[5,6]);
    this.tap.animations.add('postBucket',tapPostBucketAnimArray,5,false);
  },

  getAnimationArray: function (name, frames) {
    for (var i = 0; i < frames.length; i++) {
      frames[i] = name + frames[i] + '.png';
    }
    return frames;
  },

  getCurrentLocalFrame: function (sprite) {
    var currentLocalFrameInAnimation = sprite.animations.currentAnim._frames.indexOf(sprite.animations.currentAnim.frame);
    return currentLocalFrameInAnimation;
  },

};
