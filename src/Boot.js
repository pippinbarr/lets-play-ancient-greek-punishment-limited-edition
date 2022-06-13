BasicGame = {

  /* Here we've just got some global level vars that persist regardless of State swaps */
  score: 0,

  /* If the music in your game needs to play through-out a few State swaps, then you could reference it here */
  music: null,

  /* Your game can check BasicGame.orientated in internal loops to know if it should pause or not */
  orientated: false

};

BasicGame.Boot = function (game) {
};

BasicGame.Boot.prototype = {

  init: function () {

    this.input.maxPointers = 1;
    this.stage.disableVisibilityChange = true;

    if (this.game.device.desktop)
    {
      // this.game.canvas.parentElement.removeChild(this.game.canvas);
      // document.body.appendChild(this.game.canvas);

      this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.scale.setMinMax(400, 200, 800, 400);
      this.scale.pageAlignHorizontally = true;
      this.scale.pageAlignVertically = true;
      this.scale.windowConstraints.bottom = "visual";
      this.game.scale.refresh();
    }
    else
    {
      document.getElementById("game").appendChild(this.game.canvas);

      this.scale.scaleMode = Phaser.ScaleManager.SHOW_ALL;
      this.scale.setMinMax(200, 100, 800, 400);
      this.scale.pageAlignHorizontally = true;
      this.scale.pageAlignVertically = true;
      this.scale.forceOrientation(true, false);
      this.scale.enterIncorrectOrientation.add(this.enterIncorrectOrientation, this);
      this.scale.leaveIncorrectOrientation.add(this.leaveIncorrectOrientation, this);
      this.scale.setResizeCallback(this.gameResized, this);
    }

  },

  preload: function () {

    //  Here we load the assets required for our preloader (in this case a background and a loading bar)
    // this.load.image('preloaderBackground', 'images/preloader_background.jpg');
    // this.load.image('preloaderBar', 'images/preloader_bar.png');

  },

  create: function () {

    this.state.start('Preloader');

  },

  gameResized: function (width, height) {

    //  This could be handy if you need to do any extra processing if the game resizes.
    //  A resize could happen if for example swapping orientation on a device or resizing the browser window.
    //  Note that this callback is only really useful if you use a ScaleMode of RESIZE and place it inside your main game state.

    // Resize the div containing the div to get it to behave nicely when
    // a phone's chrome intrudes, as Phaser doesn't seem to notice this
    // somehow?
    var divgame = document.getElementById("game");
    divgame.style.width = window.innerWidth + "px";
    divgame.style.height = window.innerHeight + "px";

  },


  enterIncorrectOrientation: function () {

    BasicGame.orientated = false;

    document.getElementById('orientation').style.display = 'block';

  },

  leaveIncorrectOrientation: function () {

    BasicGame.orientated = true;

    document.getElementById('orientation').style.display = 'none';

  }
};
