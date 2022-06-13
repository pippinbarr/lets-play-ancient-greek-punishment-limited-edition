
BasicGame.Tantalus = function (game) {

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

BasicGame.Tantalus.prototype = {

  STATE: {
    EAT_DRINK_IDLE: "EAT_DRINK_IDLE",
    EAT_REACH: "EAT_REACH",
    EAT_UNREACH: "EAT_UNREACH",
    TAKE_AND_EAT: "TAKE_AND_EAT",
    DRINK_REACH: "DRINK_REACH",
    DRINK_DRINKING: "DRINK_DRINKING",
    DRINK_UNREACH: "DRINK_UNREACH",
    FREE: "FREE",
  },
  WATER_TIME_PER_LEVEL: 2000,
  MAX_INPUT_DELAY: 200,
  timeSinceFruitInput: 2000,
  timeSinceWaterInput: 2000,
  fruitEaten: 0,
  waterDrunk: 8,//0,
  waterDrinkingTime: 0,
  waterHeight: 9,
  MAX_WATER_DRUNK: 9,
  TANTALUS_SPEED: 0.2,
  state: null,

  create: function () {
    // GENERAL SETUP

    SCALE = 4;
    // document.body.style.backgroundColor = '#222222';
    this.stage.backgroundColor = '#AAFFAA';

    // SPRITES

    this.bg = this.addSprite(0,0,'tantalus/bg');
    this.fruit = this.addSprite(96*SCALE,30*SCALE,'tantalus/fruit');
    SCALE = 8;
    this.tantalus = this.addSprite(48.5*SCALE,15*SCALE,'tantalus/tantalus/fruit_1');
    this.tantalus.anchor.x = 0.5;
    this.water = this.addSprite(30*SCALE,31*SCALE,'tantalus/water');
    this.water.anchor.y = 1;
    this.water.width = 40*SCALE+1;
    this.water.height = this.waterHeight*SCALE;
    this.water.y += this.water.height;

    this.fruitHit = this.game.add.sprite(this.fruit.x - 4*SCALE,this.fruit.y - 4*SCALE,'atlas','tantalus/fruit.png');
    this.fruitHit.width = this.fruit.width + 8*SCALE;
    this.fruitHit.height = this.fruit.height + 8*SCALE;
    this.fruitHit.alpha = 0;

    this.waterHit = this.game.add.sprite(this.water.x - 4*SCALE,this.water.y - this.water.height - 4*SCALE,'atlas','tantalus/fruit.png');
    this.waterHit.width = this.water.width + 8*SCALE;
    this.waterHit.height = this.water.height + 8*SCALE;
    this.waterHit.alpha = 0;

    // ANIMATION

    this.setupAnimations();

    // SFX

    this.pointSFX = this.game.add.audio('peckSFX');

    // TEXTS

    var fruitInstructionsStyle = { font: FONT_SIZE_SMALL + "px commodore_64_pixelizedregular", fill: "#000000", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    var waterInstructionsStyle = { font: FONT_SIZE_SMALL + "px commodore_64_pixelizedregular", fill: "#FFFFFF", lineHeight: 2, wordWrap: true, wordWrapWidth: 200, align: "center"};

    var fruitInstructionsString = "RAPIDLY " + INPUT_WORD + " THE FRUIT TO TAKE IT!";
    var waterInstructions2String = "RAPIDLY " + INPUT_WORD + " THE WATER TO DRINK IT!";

    this.fruitInstructionsText = this.game.add.text(58*SCALE, 11*SCALE, fruitInstructionsString, fruitInstructionsStyle);
    this.fruitInstructionsText.lineSpacing = -8;

    this.waterInstructionsText = this.game.add.text(4*SCALE, 34*SCALE, waterInstructions2String, waterInstructionsStyle);
    this.waterInstructionsText.lineSpacing = -8;

    var fruitStyle = { font: FONT_SIZE_BIG + "px commodore_64_pixelizedregular", fill: "#000000", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.fruitText = this.game.add.text(20*SCALE,2*SCALE, '', fruitStyle);
    this.fruitText.angle = 32;

    var waterStyle = { font: FONT_SIZE_BIG + "px commodore_64_pixelizedregular", fill: "#FFFFFF", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.waterText = this.game.add.text(38*SCALE,43*SCALE, '', waterStyle);

    // TRACKING

    this.state = this.STATE.EAT_DRINK_IDLE;

    this.fruitEaten = 0;
    this.waterDrunk = 0;

    this.updateTexts();

    // INPUT

    this.input.onDown.add(this.onDown,this);

  },

  update: function () {
    console.log(this.state);

    this.timeSinceFruitInput += this.game.time.elapsed;
    this.timeSinceWaterInput += this.game.time.elapsed;
    this.handleTantalus();
  },

  handleTantalus: function () {
    this.enoughFruitInput = (this.fruit.visible && this.timeSinceFruitInput < this.MAX_INPUT_DELAY);
    this.enoughWaterInput = (this.water.visible && this.timeSinceWaterInput < this.MAX_INPUT_DELAY);

    // this.enoughWaterInput = true;

    switch (this.state) {
      case this.STATE.EAT_DRINK_IDLE:
      if (this.enoughFruitInput) {
        this.startFruitInput();
      }
      else if (this.enoughWaterInput) {
        this.startWaterInput();
      }

      break;

      case this.STATE.EAT_REACH:
      this.handleReachingFruitInput();

      break;

      case this.STATE.EAT_UNREACH:
      this.handleUnreachingFruitInput();

      break;

      case this.STATE.DRINK_REACH:
      this.handleReachingDrinkInput();

      break;

      case this.STATE.DRINK_DRINKING:
      this.handleDrinkingDrinkInput();

      break;

      case this.STATE.DRINK_UNREACH:
      this.handleUnreachingDrinkInput();

      break;

      case this.STATE.FREE:
      if (Math.abs(this.destination - this.tantalus.x) < 5) {
        if (this.tantalus.animations.currentAnim.name != "eat_drink_idle") {
          this.tantalus.animations.play("walk_idle");
        }
        return;
      }

      if (this.destination < this.tantalus.x) {
        this.tantalus.x -= this.TANTALUS_SPEED*SCALE;
      }
      else {
        this.tantalus.x += this.TANTALUS_SPEED*SCALE;
      }
      break;


    }
  },

  startFruitInput: function () {
    this.tantalus.animations.play('eat_reach');
    this.state = this.STATE.EAT_REACH;
    this.tantalus.animations.currentAnim.onComplete.removeAll();
    this.tantalus.animations.currentAnim.onComplete.addOnce(function (){
      this.fruitInstructionsText.visible = false;
      this.state = this.STATE.TAKE_AND_EAT;
      this.fruit.visible = false;
      this.tantalus.animations.play('eat_take_and_eat');
      this.tantalus.animations.currentAnim.onComplete.removeAll();
      this.tantalus.animations.currentAnim.onComplete.addOnce(function () {
        this.fruitEaten++;
        this.pointSFX.play();
        this.updateTexts();
        if (this.water.visible) {
          this.state = this.STATE.EAT_DRINK_IDLE;
          this.tantalus.animations.play('eat_drink_idle');
        }
        else {
          this.state = this.STATE.FREE;
          this.destination = this.tantalus.x;
          this.tantalus.animations.play('eat_drink_idle');
        }
      },this)
    },this)
  },

  handleReachingFruitInput: function () {
    if (!this.enoughFruitInput) {
      this.state = this.STATE.EAT_UNREACH;

      var reverseFrame = this.getReverseFrameIndex();
      this.tantalus.animations.play('eat_unreach');
      this.tantalus.animations.currentAnim.frame = reverseFrame;
      this.tantalus.animations.currentAnim.onComplete.removeAll();
      this.tantalus.animations.currentAnim.onComplete.addOnce(function () {
        this.state = this.STATE.EAT_DRINK_IDLE;
        this.tantalus.animations.play('eat_drink_idle');
      },this);
    }
  },

  handleUnreachingFruitInput: function () {
    if (this.enoughFruitInput) {
      this.state = this.STATE.EAT_REACH;
      var reverseFrame = this.getReverseFrameIndex();
      this.tantalus.animations.play('eat_reach');
      this.tantalus.animations.currentAnim.frame = reverseFrame;
    }
  },

  startWaterInput: function () {
    this.tantalus.animations.play('drink_reach');
    this.state = this.STATE.DRINK_REACH;
  },

  handleReachingDrinkInput: function () {
    if (!this.enoughWaterInput) {
      this.state = this.STATE.DRINK_UNREACH;
      var reverseFrame = this.getReverseFrameIndex();
      this.tantalus.animations.play('drink_unreach');
      this.tantalus.animations.currentAnim.frame = reverseFrame;
      this.tantalus.animations.currentAnim.onComplete.removeAll();
      this.tantalus.animations.currentAnim.onComplete.addOnce(function () {
        this.state = this.STATE.EAT_DRINK_IDLE;
        this.tantalus.animations.play('eat_drink_idle');
      },this);
    }
    else {
      if ((this.getCurrentLocalFrame() >= 2 + this.waterDrunk) ||
          (this.waterDrunk == 8 && this.getCurrentLocalFrame() >= 1 + this.waterDrunk)) {
        // They've reached the appropriate depth
        console.log("About to play drink_" + this.waterDrunk);
        this.state = this.STATE.DRINK_DRINKING;
        this.tantalus.animations.play('drink_' + this.waterDrunk);

        this.tantalus.animations.currentAnim.onComplete.removeAll();
      }
    }

  },

  handleDrinkingDrinkInput: function () {
    if (!this.enoughWaterInput) {
      var currentFrame = this.tantalus.animations.currentAnim.frame;
      this.tantalus.animations.play('drink_unreach');
      this.tantalus.animations.currentAnim.onComplete.removeAll();
      this.tantalus.animations.currentAnim.onComplete.addOnce(function () {
        this.state = this.STATE.EAT_DRINK_IDLE;
        this.tantalus.animations.play('eat_drink_idle');
      },this);
      var index = this.tantalus.animations.currentAnim._frames.indexOf(currentFrame);
      if (index != -1) {
        this.tantalus.animations.currentAnim.frame = index;
      }
      else {
        index = this.tantalus.animations.currentAnim._frames.indexOf(currentFrame-1);
        this.tantalus.animations.currentAnim.frame = index;
      }
      this.state = this.STATE.DRINK_UNREACH;
    }
    else {
      this.waterDrinkingTime += this.game.time.elapsed;
      if (this.waterDrinkingTime > this.WATER_TIME_PER_LEVEL) {
        this.waterDrinkingTime = 0;
        this.water.height -= 1*SCALE;
        this.waterDrunk++;
        this.pointSFX.play();
        this.waterInstructionsText.visible = false;
        this.updateTexts();

        if (this.waterDrunk >= this.MAX_WATER_DRUNK) {
          this.water.visible = false;
          this.state = this.STATE.DRINK_UNREACH;
          var currentFrame = this.tantalus.animations.currentAnim.frame;
          this.tantalus.animations.play('drink_unreach');
          this.tantalus.animations.currentAnim.onComplete.removeAll();
          if (!this.fruit.visible) {
            this.tantalus.animations.currentAnim.onComplete.addOnce(function () {
              this.state = this.STATE.FREE;
              this.destination = this.tantalus.x;
              this.tantalus.animations.play('eat_drink_idle');
            },this);
          }
          else {
            this.tantalus.animations.currentAnim.onComplete.addOnce(function () {
              this.state = this.STATE.EAT_DRINK_IDLE;
              this.tantalus.animations.play('eat_drink_idle');
            },this);
          }
          var index = this.tantalus.animations.currentAnim._frames.indexOf(currentFrame);
          if (index != -1) {
            this.tantalus.animations.currentAnim.frame = index;
          }
          else {
            index = this.tantalus.animations.currentAnim._frames.indexOf(currentFrame-1);
            this.tantalus.animations.currentAnim.frame = index;
          }
        }
        else {
          this.state = this.STATE.DRINK_REACH;
          var currentFrame = this.tantalus.animations.currentAnim.frame;
          this.tantalus.animations.play('drink_reach');
          var index = this.tantalus.animations.currentAnim._frames.indexOf(currentFrame);
          if (index != -1) {
            this.tantalus.animations.currentAnim.frame = index;
          }
          else {
            index = this.tantalus.animations.currentAnim._frames.indexOf(currentFrame-1);
            this.tantalus.animations.currentAnim.frame = index;
          }
        }
      }
    }
  },

  handleUnreachingDrinkInput: function () {
    if (this.enoughWaterInput) {
      this.state = this.STATE.DRINK_REACH;
      var reverseFrame = this.getReverseFrameIndex();
      this.tantalus.animations.play('drink_reach');
      this.tantalus.animations.currentAnim.frame = reverseFrame;
    }
  },

  getReverseFrameIndex: function () {
    var currentLocalFrameInAnimation = this.tantalus.animations.currentAnim._frames.indexOf(this.tantalus.animations.currentAnim.frame);
    var reverseFrameIndex = (this.tantalus.animations.currentAnim.frameTotal - currentLocalFrameInAnimation - 1);
    return reverseFrameIndex;
  },

  getCurrentLocalFrame: function () {
    var currentLocalFrameInAnimation = this.tantalus.animations.currentAnim._frames.indexOf(this.tantalus.animations.currentAnim.frame);
    return currentLocalFrameInAnimation;
  },

  updateTexts: function () {
    this.fruitText.text = "FRUIT: " + this.fruitEaten;
    this.waterText.text = "WATER: " + this.waterDrunk;
  },

  onDown: function (pointer) {

    if (this.fruitHit.getBounds().contains(pointer.x,pointer.y)) this.timeSinceFruitInput = 0;
    if (this.waterHit.getBounds().contains(pointer.x,pointer.y)) this.timeSinceWaterInput = 0;

    if (this.state == this.STATE.FREE) {
      this.destination = pointer.x;
      if (this.destination < 70*4) {
        this.destination = 70*4;
      }
      else if (this.destination > 128*4) {
        this.destination = 128*4;
      }
      if (this.destination < this.tantalus.x) {
        this.tantalus.scale.x = -Math.abs(this.tantalus.scale.x);
      }
      else {
        this.tantalus.scale.x = Math.abs(this.tantalus.scale.x);
      }
      this.tantalus.animations.play("walk");
    }
  },

  addSprite: function (x, y, name) {
    var newSprite = this.add.sprite(0, 0, 'atlas', name + '.png');
    newSprite.scale.x *= SCALE; newSprite.scale.y *= SCALE;
    newSprite.x = x; newSprite.y = y;
    return newSprite;
  },

  setupAnimations: function () {
    var FRAME_RATE = 5;

    var eatDrinkIdleAnimArray = this.getAnimationArray('tantalus/tantalus/fruit_',[1]);
    this.tantalus.animations.add('eat_drink_idle',eatDrinkIdleAnimArray,FRAME_RATE);

    var eatReachAnimArray = this.getAnimationArray('tantalus/tantalus/fruit_',[2,3,4,5,6,7]);
    this.tantalus.animations.add('eat_reach',eatReachAnimArray,FRAME_RATE);

    var eatUnreachAnimArray = this.getAnimationArray('tantalus/tantalus/fruit_',[7,6,5,4,3,2]);
    this.tantalus.animations.add('eat_unreach',eatUnreachAnimArray,FRAME_RATE);

    var eatTakeAndEatAnimArray = this.getAnimationArray('tantalus/tantalus/fruit_',[8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23]);
    this.tantalus.animations.add('eat_take_and_eat',eatTakeAndEatAnimArray,FRAME_RATE);

    var drinkReachAnimArray = this.getAnimationArray('tantalus/tantalus/water_',[2,3,4,6,8,10,12,14,16,18]);
    this.tantalus.animations.add('drink_reach',drinkReachAnimArray,FRAME_RATE);

    var drinkDrink0AnimArray = this.getAnimationArray('tantalus/tantalus/water_',[4,5]);
    this.tantalus.animations.add('drink_0',drinkDrink0AnimArray,FRAME_RATE,true);

    var drinkDrink1AnimArray = this.getAnimationArray('tantalus/tantalus/water_',[6,7]);
    this.tantalus.animations.add('drink_1',drinkDrink1AnimArray,FRAME_RATE,true);

    var drinkDrink2AnimArray = this.getAnimationArray('tantalus/tantalus/water_',[8,9]);
    this.tantalus.animations.add('drink_2',drinkDrink2AnimArray,FRAME_RATE,true);

    var drinkDrink3AnimArray = this.getAnimationArray('tantalus/tantalus/water_',[10,11]);
    this.tantalus.animations.add('drink_3',drinkDrink3AnimArray,FRAME_RATE,true);

    var drinkDrink4AnimArray = this.getAnimationArray('tantalus/tantalus/water_',[12,13]);
    this.tantalus.animations.add('drink_4',drinkDrink4AnimArray,FRAME_RATE,true);

    var drinkDrink5AnimArray = this.getAnimationArray('tantalus/tantalus/water_',[14,15]);
    this.tantalus.animations.add('drink_5',drinkDrink5AnimArray,FRAME_RATE,true);

    var drinkDrink6AnimArray = this.getAnimationArray('tantalus/tantalus/water_',[16,17]);
    this.tantalus.animations.add('drink_6',drinkDrink6AnimArray,FRAME_RATE,true);

    var drinkDrink7AnimArray = this.getAnimationArray('tantalus/tantalus/water_',[18,19]);
    this.tantalus.animations.add('drink_7',drinkDrink7AnimArray,FRAME_RATE,true);
    this.tantalus.animations.add('drink_8',drinkDrink7AnimArray,FRAME_RATE,true);

    var drinkUnreachAnimArray = this.getAnimationArray('tantalus/tantalus/water_',[18,16,14,12,10,8,6,4,3,2]);
    this.tantalus.animations.add('drink_unreach',drinkUnreachAnimArray,FRAME_RATE);

    var walkIdleAnimArray = this.getAnimationArray('tantalus/tantalus/walking_',[1]);
    this.tantalus.animations.add('walk_idle',walkIdleAnimArray,FRAME_RATE,false);

    var walkAnimArray = this.getAnimationArray('tantalus/tantalus/walking_',[2,3,4]);
    this.tantalus.animations.add('walk',walkAnimArray,FRAME_RATE,true);
  },

  getAnimationArray: function (name, frames) {
    for (var i = 0; i < frames.length; i++) {
      frames[i] = name + frames[i] + '.png';
    }
    return frames;
  },

};
