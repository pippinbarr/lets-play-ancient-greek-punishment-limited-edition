
BasicGame.Prometheus = function (game) {

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

BasicGame.Prometheus.prototype = {

  DAY_STATE: {
    DAY: "DAY",
    END_OF_DAY: "END_OF_DAY",
    DAY2NIGHT: 'DAY2NIGHT',
    NIGHT: "NIGHT",
    NIGHT2DAY: "NIGHT2DAY"
  },

  PROMETHEUS_STATE: {
    CHAINED: "CHAINED",
    STANDING: "STANDING",
    FREE: "FREE"
  },

  EAGLE_STATE: {
    PRE_ARRIVAL: "PRE_ARRIVAL",
    ARRIVING: "ARRIVING",
    PERCHED: "PERCHED",
    PECKING: "PECKING",
    FLAP_UP: "FLAP_UP",
    HOVER: "HOVER",
    FLAP_DOWN: "FLAP_DOWN",
    PRE_DEPARTURE: "PRE_DEPARTURE",
    DEPARTING: "DEPARTING",
    DEPARTED: "DEPARTED",
    GONE: "GONE"
  },

  liverText: null,
  daysText: null,
  instructionsText: null,

  MAX_WRIGGLE_COUNT: 10,
  wriggleCount: 0,
  showInstructions: true,

  EAGLE_LAND_Y: 50,
  EAGLE_FLAP_HEIGHT: 40,
  postEagleDepartureDelay: 2,
  nightDuration: 10,
  chainedNightDuration: 5,
  dayDuration: 10,
  LIVER_DAMAGE: 5,
  liver: 100,
  days: 0,

  LEFT_SIDE_X: 90*4,
  RIGHT_SIDE_X: 112*4,

  peckSFX: null,
  liverSFX: null,

  dayState: null,
  freeState: "idleRight",

  create: function () {

    // GENERAL SETUP

    SCALE = 4;

    // document.body.style.backgroundColor = '#333333';
    this.stage.backgroundColor = '#FFAAAA';

    this.dayState = this.DAY_STATE.DAY;
    this.prometheus = {};
    this.prometheus.state = this.PROMETHEUS_STATE.CHAINED;

    this.spritesJSON = this.game.cache.getJSON('sprites');

    // SPRITES AND ANIMATIONS

    this.rock = this.addSprite(0,0,'prometheus/rock');
    this.prometheus.chained = this.addSprite(360,220,'prometheus/chained/prometheus_chained_1');
    this.prometheus.getting_up = this.addSprite(0,0,'prometheus/getting_up/prometheus_getting_up_1');
    this.prometheus.freeDay = this.addSprite(0,0,'prometheus/free_day/prometheus_free_1');
    this.prometheus.current = this.prometheus.freeDay;

    this.eagle = this.addSprite(0,0,'prometheus/eagle/eagle_1');
    this.eagle.state = this.EAGLE_STATE.PRE_ARRIVAL;

    this.chains = this.addSprite(0,0,'prometheus/chains');
    // this.chainsRemains = this.addSprite(0,0,'prometheus/chains_remains');

    this.rock = this.addSprite(0,0,'prometheus/rock');

    this.leftChainEmitter = this.createEmitter(380, 260);
    this.rightChainEmitter = this.createEmitter(420, 260);

    this.prometheus.freeDay.animations.play('freeIdleRight');
    this.prometheus.freeDay.visible = false;
    this.prometheus.getting_up.visible = false;

    this.eagle.animations.play('flying');
    this.eagle.x = 22*SCALE;
    this.eagle.y = -20*SCALE;

    // NIGHT SPRITES

    this.nightRock = this.addSprite(0,0,'prometheus/night_rock');
    this.nightChains = this.addSprite(0,0,'prometheus/night_chains');

    this.prometheus.chainedNight = this.addSprite(360,220,'prometheus/chained/prometheus_chained_3');

    this.prometheus.freeNight = this.addSprite(0,0,'prometheus/free_night/prometheus_free_1');
    // this.prometheus.freeNight.animations.play('freeIdleRight');

    this.nightRock.visible = false;
    this.nightChains.visible = false;
    this.prometheus.chainedNight.visible = false;
    this.prometheus.freeNight.alpha = 0;

    this.setupAnimations();

    // SFX

    this.peckSFX = this.game.add.audio('peckSFX');
    this.liverSFX = this.game.add.audio('swoopDownSFX');

    // TEXTS

    var instructionsString = "RAPIDLY " + INPUT_WORD + " TO WRITHE IN PAIN AND DISLODGE THE EAGLE!";

    var instructionsStyle = { font: FONT_SIZE_SMALL + "px commodore_64_pixelizedregular", fill: "#000000", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.instructionsText = this.game.add.text(this.game.width/2, 20*SCALE, instructionsString, instructionsStyle);
    this.instructionsText.lineSpacing = -8;
    this.instructionsText.anchor.x = 0.5;

    var statStyle = { font: FONT_SIZE_BIG + "px commodore_64_pixelizedregular", fill: "#000000", lineHeight: 2, wordWrap: true, wordWrapWidth: this.game.width - 400, align: "center"};
    this.liverText = this.game.add.text(15*SCALE, 60*SCALE, '', statStyle);
    this.daysText = this.game.add.text(125*SCALE, 60*SCALE, '', statStyle);

    this.updateTexts();

    // INPUT

    this.input.onDown.add(this.onDown,this);

    // START THE GAME, BUD

    this.eagleArrivalEvent = this.game.time.events.add(Phaser.Timer.SECOND * 2, function () {
      this.eagle.state = this.EAGLE_STATE.ARRIVING;
    }, this);
  },

  update: function () {
    this.handleEagle();
    // this.handleDayNight();
    // this.handlePrometheus();
  },

  handleEagle: function () {
    switch (this.eagle.state) {
      case this.EAGLE_STATE.PRE_ARRIVAL:
      this.eagle.animations.play('flying');
      break;

      case this.EAGLE_STATE.ARRIVING:
      if (this.eagle.y < this.EAGLE_LAND_Y*SCALE) {
        this.moveEagle(1,1);
      }
      else {
        this.eagle.state = this.EAGLE_STATE.PERCHED;
        this.eagle.play("perching");
        this.cuePeck();
      };

      break;

      case this.EAGLE_STATE.PERCHED:
      if (this.liver == 0) {
        if (this.peckEvent) {
          this.game.time.events.remove(this.peckEvent);
        }
        this.eagle.state = this.EAGLE_STATE.PRE_DEPARTURE;
        this.departingEvent = this.game.time.events.add(Phaser.Timer.SECOND * 2, function () {
          this.eagle.state = this.EAGLE_STATE.DEPARTING;
          this.eagle.animations.play("flying");
        },this);
      }

      break;

      case this.EAGLE_STATE.PRE_DEPARTURE:

      break;

      case this.EAGLE_STATE.FLAP_UP:
      this.moveEagle(0,-1);
      if (this.eagle.y <= this.EAGLE_FLAP_HEIGHT*SCALE) {
        this.eagle.state = this.EAGLE_STATE.HOVER;
        var hoverTime = Phaser.Timer.SECOND * Math.random() * 3;
        this.hoverEvent = this.game.time.events.add(hoverTime, function () {
          this.eagle.state = this.EAGLE_STATE.FLAP_DOWN;
          this.instructionsText.visible = false;
        },this);
      }

      break;

      case this.EAGLE_STATE.HOVER:

      break;

      case this.EAGLE_STATE.FLAP_DOWN:
      if (this.eagle.y < this.EAGLE_LAND_Y*SCALE) {
        this.moveEagle(0,1);
      }
      else {
        this.eagle.state = this.EAGLE_STATE.PERCHED;
        this.eagle.play("perching");
        this.cuePeck();
      };

      break;

      case this.EAGLE_STATE.DEPARTING:
      if (this.eagle.y > -10*SCALE) {
        this.moveEagle(1,-1);
      }
      else {
        this.eagle.state = this.EAGLE_STATE.DEPARTED;
        this.postEagleDepartureEvent = this.game.time.events.add(Phaser.Timer.SECOND * this.postEagleDepartureDelay,function () {
          if (this.prometheus.freeDay.visible || this.prometheus.freeNight.alpha == 1) {
            this.eagle.state = this.EAGLE_STATE.GONE;
          }
        },this);
      }

      break;

      case this.EAGLE_STATE.DEPARTED:

      break;
    }
  },

  handleDayNight: function () {
    switch (this.dayState) {

      case this.DAY_STATE.DAY:
      if (this.eagle.state == this.EAGLE_STATE.DEPARTED) {
        // console.log("handleDayNight : DAY : EAGLE DEPARTED");
        this.game.time.events.add(Phaser.Timer.SECOND * this.postEagleDepartureDelay,function () {
          this.dayState = this.DAY_STATE.DAY2NIGHT;
        },this);
        this.dayState = this.DAY_STATE.END_OF_DAY;
      }
      break;

      case this.DAY_STATE.END_OF_DAY:

      break;

      case this.DAY_STATE.DAY2NIGHT:
      this.liverText.visible = false;
      this.daysText.visible = false;
      this.instructionsText.visible = false;
      this.nightRock.visible = true;

      if (this.prometheus.freeDay.visible) {
        this.prometheus.freeNight.alpha = 1;
        this.mirror(this.prometheus.freeNight,this.prometheus.freeDay);
        this.prometheus.current = this.prometheus.freeNight;
        this.game.time.events.add(Phaser.Timer.SECOND * this.nightDuration,function() {
          this.dayState = this.DAY_STATE.NIGHT2DAY;
        },this);
        this.dayState = this.DAY_STATE.NIGHT;
      }
      else {
        this.prometheus.chainedNight.visible = true;
        this.nightChains.visible = true;
        // console.log("Adding event of " + this.chainedNightDuration + "s before changing day state...")
        this.game.time.events.add(Phaser.Timer.SECOND * this.chainedNightDuration,function() {
          this.dayState = this.DAY_STATE.NIGHT2DAY;
        },this);
        this.dayState = this.DAY_STATE.NIGHT;
      }

      break;

      case this.DAY_STATE.NIGHT:

      break;

      case this.DAY_STATE.NIGHT2DAY:
      this.nightRock.visible = false;

      if (this.prometheus.freeNight.alpha == 1) {
        this.prometheus.freeDay.visible = true;
        this.prometheus.freeNight.alpha = 0;
        this.mirror(this.prometheus.freeDay,this.prometheus.freeNight);
        this.prometheus.current = this.prometheus.freeDay;
      }
      else {
        this.prometheus.chainedNight.visible = false;
        this.nightChains.visible = false;
        this.eagleArrivalEvent = this.game.time.events.add(Phaser.Timer.SECOND * 2, function () {
          this.eagle.state = this.EAGLE_STATE.ARRIVING;
        }, this);

      }

      this.liverText.visible = true;
      this.daysText.visible = true;
      if (this.showInstructions) this.instructionsText.visible = true;

      this.dayState = this.DAY_STATE.DAY;

      if (this.liver != 100) this.liverSFX.play();
      this.liver = 100;
      this.days++;
      this.updateTexts();

      if (this.eagle.state == this.EAGLE_STATE.GONE) {
        this.game.time.events.add(Phaser.Timer.SECOND * this.dayDuration,function () {
          this.dayState = this.DAY_STATE.DAY2NIGHT;
        },this);
        this.dayState = this.DAY_STATE.END_OF_DAY;
      }
      else {
        this.eagle.state = this.EAGLE_STATE.PRE_ARRIVAL;
        this.eagle.animations.play('flying');
        this.eagle.x = 22*SCALE;
        this.eagle.y = -20*SCALE;
        this.eagleArrivalEvent = this.game.time.events.add(Phaser.Timer.SECOND * 2, function () {
          this.eagle.state = this.EAGLE_STATE.ARRIVING;
        }, this);
      }

      break;

    }
  },

  mirror: function (target, source) {

    target.animations.play(source.animations.currentAnim.name);
    target.animations.currentAnim.frame = this.getCurrentLocalFrame(source);
    target.animations.paused = source.animations.paused;
  },

  handlePrometheus: function () {
    switch (this.prometheus.state) {

      case this.PROMETHEUS_STATE.FREE:

      var frame = this.getCurrentLocalFrame(this.prometheus.current);
      var animName = this.prometheus.current.animations.currentAnim.name;

      // console.log(animName);

      if (animName == 'freeWalkLeft') {
        if (this.getPrometheusX() <= this.destination && this.getPrometheusX() > this.LEFT_SIDE_X) {
          this.prometheus.current.animations.play('freeIdleLeft');
          this.prometheus.current.animations.currentAnim.frame = frame;
          this.prometheus.current.animations.paused = true;
        }
      }
      else if (animName == 'freeWalkRight'){
        // console.log("freeWalkRight");
        // console.log(this.getPrometheusX() + " >= " + this.destination);
        // console.log("&& " + this.getPrometheusX() + " < " + this.RIGHT_SIDE_X);
        if (this.getPrometheusX() >= this.destination && this.getPrometheusX() < this.RIGHT_SIDE_X) {
          this.prometheus.current.animations.play('freeIdleRight');
          this.prometheus.current.animations.currentAnim.frame = frame;
          this.prometheus.current.animations.paused = true;
        }
      }

      break;

    }

  },

  updateTexts: function () {
    this.liverText.text = "LIVER: " + this.liver + "%";
    this.daysText.text = "DAYS: " + this.days;
  },

  moveEagle: function (xFactor, yFactor) {
    this.eagle.x += xFactor*0.3*SCALE;
    this.eagle.y += yFactor*0.3*SCALE;
  },

  cuePeck: function () {
    this.peckEvent = this.game.time.events.add(Phaser.Timer.SECOND * (Math.random() * 2 + 1), this.peck, this);
  },

  peck: function () {
    this.eagle.state = this.EAGLE_STATE.PECKING;
    this.eagle.animations.play("peck");
    this.peckSFX.play();
    this.liver -= this.LIVER_DAMAGE;
    this.eagle.animations.currentAnim.onComplete.addOnce(function (){
      this.updateTexts();
      this.eagle.state = this.EAGLE_STATE.PERCHED;
      this.eagle.play("perching");
      this.cuePeck();
    },this);
  },

  onDown: function (pointer) {
    switch (this.prometheus.state) {

      case this.PROMETHEUS_STATE.CHAINED:
      if (this.liver > 0) {
        this.wriggleCount++;
        this.prometheus.chained.animations.play("struggle");
        if (this.eagle.state == this.EAGLE_STATE.PERCHED) {
          this.eagle.state = this.EAGLE_STATE.FLAP_UP;
          this.eagle.animations.play('flying');
          if (this.peckEvent) {
            this.game.time.events.remove(this.peckEvent);
          }
        }
        if (this.chains.visible && this.wriggleCount > this.MAX_WRIGGLE_COUNT) {
          this.getUp();
        }
      }

      break;

      case this.PROMETHEUS_STATE.STANDING:

      break;

      case this.PROMETHEUS_STATE.FREE:

      this.destination = pointer.x;

      if (Math.abs(this.destination - this.getPrometheusX()) < 10) {
        return;
      }

      var frame = this.getCurrentLocalFrame(this.prometheus.current);
      var animName = this.prometheus.current.animations.currentAnim.name;

      if (this.destination < this.getPrometheusX()) {
        if (animName == 'freeWalkRight' || animName == 'freeIdleRight') {
          frame = this.getReverseFrameIndex(this.prometheus.current);
        }
        this.prometheus.current.animations.play('freeWalkLeft');
        this.prometheus.current.animations.paused = false;
        this.prometheus.current.animations.currentAnim.frame = frame;
      }
      else if (this.destination > this.getPrometheusX()) {
        if (animName == 'freeWalkLeft' || animName == 'freeIdleLeft') {
          frame = this.getReverseFrameIndex(this.prometheus.current);
        }
        this.prometheus.current.animations.play('freeWalkRight');
        this.prometheus.current.animations.paused = false;
        this.prometheus.current.animations.currentAnim.frame = frame;
      }

      break;
    }
  },

  getUp: function () {
    this.prometheus.state = this.PROMETHEUS_STATE.STANDING;

    if (this.hoverEvent) this.game.time.events.remove(this.hoverEvent);
    if (this.peckEvent) this.game.time.events.remove(this.peckEvent);

    this.game.time.events.remove(this.eagleArrivalEvent);
    this.postEagleDepartureDelay = 10;
    this.eagle.state = this.EAGLE_STATE.DEPARTING;
    this.eagle.animations.play("flying");

    this.showInstructions = false;
    this.instructionsText.visible = false;

    this.chains.visible = false;
    this.leftChainEmitter.start(true, 2000, null, 10);
    this.rightChainEmitter.start(true, 2000, null, 10);

    this.prometheus.chained.visible = false;
    this.prometheus.getting_up.visible = true;

    this.prometheus.getting_up.play('getUp');
    this.prometheus.getting_up.animations.currentAnim.onComplete.add(function () {
      this.prometheus.getting_up.visible = false;
      this.prometheus.freeDay.visible = true;
      this.prometheus.current.animations.play('freeIdleRight');
      this.prometheus.current.animations.currentAnim.frame = 9;
      this.prometheus.current.animations.paused = true;
      this.prometheus.state = this.PROMETHEUS_STATE.FREE;
      this.destination = this.getPrometheusX();
    },this);
  },

  addSprite: function (x, y, name) {
    var newSprite = this.add.sprite(0, 0, 'atlas', name + '.png');
    newSprite.scale.x *= SCALE; newSprite.scale.y *= SCALE;
    newSprite.x = x; newSprite.y = y;
    return newSprite;
  },

  createEmitter: function (x, y) {
    var emitter = this.game.add.emitter(x, y, 100);
    emitter.makeParticles('atlas','prometheus/chain_particle.png');
    emitter.height = 12*SCALE;
    emitter.gravity = 200;
    emitter.minRotation = 0;
    emitter.maxRotation = 0;
    emitter.setXSpeed(-10,10);
    emitter.setYSpeed(0,10);
    return emitter;
  },

  setupAnimations: function () {
    var chainedAnimArray = this.getAnimationArray('prometheus/chained/prometheus_chained_',[2,1]);
    this.prometheus.chained.animations.add('struggle',chainedAnimArray,5);

    var gettingUpAnimArray = this.getAnimationArray('prometheus/getting_up/prometheus_getting_up_',[1,2,3,4,5]);
    this.prometheus.getting_up.animations.add('getUp',gettingUpAnimArray,5);


    this.setupFreeAnimations(this.prometheus.freeDay,'','_');
    this.setupFreeAnimations(this.prometheus.freeNight,'_night','_night_');

    var eagleFlyingAnimArray = this.getAnimationArray('prometheus/eagle/eagle_',[1,2,3,4]);
    this.eagle.animations.add('flying',eagleFlyingAnimArray,5,true);

    var eaglePerchAnimArray = this.getAnimationArray('prometheus/eagle/eagle_',[5,5]);
    this.eagle.animations.add('perching',eaglePerchAnimArray,5,false);

    var eaglePeckAnimArray = this.getAnimationArray('prometheus/eagle/eagle_',[6]);
    this.eagle.animations.add('peck',eaglePeckAnimArray,10,false);
  },

  setupFreeAnimations: function (sprite, ext, ext2) {
    var freeIdleRightAnimArray = this.getAnimationArrayByRange('prometheus/free_right_idle' + ext + '/prometheus_free_right_idle' + ext2,1,19);
    var freeIdleLeftAnimArray = this.getAnimationArrayByRange('prometheus/free_left_idle' + ext + '/prometheus_free_left_idle' + ext2,19,1);
    var freeWalkRightAnimArray = this.getAnimationArrayByRange('prometheus/free_right' + ext + '/prometheus_free_right' + ext2,1,19);
    var freeWalkLeftAnimArray = this.getAnimationArrayByRange('prometheus/free_left' + ext + '/prometheus_free_left' + ext2,19,1);

    // console.log("Loading...");
    // console.log('freeIdleRightAnimArray for ' + (sprite == this.prometheus.current));
    // console.log(freeIdleRightAnimArray);
    // console.log('freeIdleLeftAnimArray for ' + (sprite == this.prometheus.current));
    // console.log(freeIdleLeftAnimArray);
    // console.log('freeWalkRightAnimArray for ' + (sprite == this.prometheus.current));
    // console.log(freeWalkRightAnimArray);
    // console.log('freeWalkLeftAnimArray for ' + (sprite == this.prometheus.current));
    // console.log(freeWalkLeftAnimArray);

    sprite.animations.add('freeIdleRight',freeIdleRightAnimArray,5);
    sprite.animations.add('freeIdleLeft',freeIdleLeftAnimArray,5);
    sprite.animations.add('freeWalkRight',freeWalkRightAnimArray,5);
    sprite.animations.add('freeWalkLeft',freeWalkLeftAnimArray,5);
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

  getPrometheusX: function () {
    var frame = this.prometheus.current.animations.currentAnim.currentFrame.name;
    var spriteX = this.spritesJSON.frames[frame].spriteSourceSize.x * SCALE;
    var spriteWidth = this.spritesJSON.frames[frame].spriteSourceSize.w * SCALE;
    return spriteX + spriteWidth/2;
  },
};
