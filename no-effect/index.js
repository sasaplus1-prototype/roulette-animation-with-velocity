(function(){

  'use strict';

  window.console || (window.console = {});
  window.console.log || (window.console.log = function() {});

  var w = 300,
      h = 300,
      r = Math.min(w, h) / 2;

  var color =
    d3
      .scale
      .ordinal()
      .range([
        '#ff7f7f',
        '#7fbfff',
        '#7fffff',
        '#7fffbf',
        '#ffff7f',
        '#ffbf7f'
      ]);

  var arc =
    d3
      .svg
      .arc()
      .outerRadius(r - 10)
      .innerRadius(0);

  var pie =
    d3
      .layout
      .pie()
      .sort(null)
      .value(function(d) {
        return d.radius;
      });

  var svg =
    d3
      .select('body')
      .append('svg')
      .attr('width', w)
      .attr('height', h)
      .attr('class', 'roulette')
      .append('g')
      .attr('transform', 'translate(' + w / 2 + ',' + h / 2 + ')');

  var g =
    svg
      .selectAll('.arc')
      .data(pie([
        { radius: 45, index: 0 },
        { radius: 45, index: 1 },
        { radius: 45, index: 2 },
        { radius: 45, index: 3 },
        { radius: 45, index: 4 },
        { radius: 45, index: 5 }
      ]))
      .enter()
      .append('g')
      .attr('class', 'pocket js-pocket')
      .attr('style', 'opacity: 0.5;')
      .attr('data-arc-index', function(d) {
        return d.data.index;
      })
      .append('path')
      .attr('d', arc)
      .style('fill', function(d) {
        return color(d.data.index);
      });

  //----------------------------------------------------------------------------

  function Pocket(props) {
    this.element = props.element;
  }

  Pocket.prototype.animate = function(props) {
    var delay, duration, loop;

    props || (props = {});

    delay = props.delay || 0;
    duration = props.duration || 0;
    loop = props.loop || 0;

    return Velocity(this.element, {
      opacity: 1
    }, {
      delay: delay,
      duration: duration,
      easing: 'ease-in-out',
      loop: loop
    });
  };

  Pocket.prototype.reset = function(props) {
    var duration;

    props || (props = {});

    duration = props.duration || 0;

    return Velocity(this.element, {
      opacity: 0.5
    }, {
      duration: duration,
      queue: false
    });
  };

  //----------------------------------------------------------------------------

  function Roulette(props) {
    var onReady = props.onReady,
        onStart = props.onStart,
        onPlaying = props.onPlaying,
        onStop = props.onStop;

    this.pockets = props.pockets;

    this.stopIndex = props.stopIndex;
    this.stepDuration = props.stepDuration;
    this.stopThreshold = props.stopThreshold;

    this.index = props.index;
    this.delay = props.delay;
    this.duration = props.duration;
    this.loop = props.loop;

    this.onReady = (typeof onReady === 'function') ? onReady : function() {};
    this.onStart = (typeof onStart === 'function') ? onStart : function() {};
    this.onPlaying = (typeof onPlaying === 'function') ? onPlaying : function() {};
    this.onStop = (typeof onStop  === 'function') ? onStop : function() {};
  }

  Roulette.prototype.states = {
    READY: 0,
    START: 1,
    PLAYING: 2,
    STOP: 3
  };

  Roulette.prototype.ready = function(props) {
    var i, len;

    for (i = 0, len = this.pockets.length; i < len; ++i) {
      this.pockets[i].reset();
    }

    props || (props = {});

    this.index = props.index;
    this.delay = props.delay;
    this.duration = props.duration;
    this.loop = props.loop;

    if (typeof props.onReady === 'function') {
      this.onReady = props.onReady;
    }

    this.state = this.states.READY;
    this.onReady();
  };

  Roulette.prototype.start = function(props) {
    this.state = this.states.START;
    this.onStart();

    props || (props = {});

    this.index || (this.index = props.index);
    this.delay || (this.delay = props.delay);
    this.duration || (this.duration = props.duration);
    this.loop || (this.loop = props.loop);

    if (typeof props.onStart === 'function') {
      this.onStart = props.onStart;
    }

    this.state = this.states.PLAYING;
    this._main();
  };

  Roulette.prototype.stop = function(props) {
    props || (props = {});

    this.stopIndex || (this.stopIndex = props.stopIndex);
    this.stepDuration || (this.stepDuration = props.stepDuration);
    this.stopThreshold || (this.stopThreshold = props.stopThreshold);

    if (typeof props.onStop === 'function') {
      this.onStop = props.onStop;
    }

    this.state = this.states.STOP;
  };

  Roulette.prototype._main = function() {
    var pockets, index, pocket, options, that;

    pockets = this.pockets;
    index = this.index;

    pocket = pockets[index % pockets.length];
    this.index = index = index + 1;

    if (index > pockets.length - 1) {
      this.index = index = 0;
    }

    //--------------------------------------------------------------------------

    if (this.state === this.states.STOP) {
      this.duration += this.stepDuration;
    }

    //--------------------------------------------------------------------------

    options = {
      delay: this.delay,
      duration: this.duration,
      loop: this.loop
    };

    this.onPlaying();

    that = this;

    pocket
      .animate(options)
      .then(function() {
        if (that.state === that.states.STOP &&
            that.index === that.stopIndex &&
            that.duration > that.stopThreshold) {
              return that.onStop();
        }

        setTimeout(function() {
          that._main();
          that = null;
        }, 0);
      });
  };

  //----------------------------------------------------------------------------

  var pockets = (function(){
    var pocketElements = document.querySelectorAll('.js-pocket');

    var result = [],
        i, len;

    for (i = 0, len = pocketElements.length; i < len; ++i) {
      result.push(new Pocket({
        element: pocketElements[i]
      }));
    }

    return result;
  }());

  //----------------------------------------------------------------------------

  var startButton = document.getElementById('js-start-button'),
      stopButton = document.getElementById('js-stop-button');

  var roulette = new Roulette({
    pockets: pockets,
    onReady: function() {
      console.log('ready');
    },
    onStart: function() {
      console.log('start');
    },
    onPlaying: function() {
      console.log('playing');
    },
    onStop: function() {
      var pocket, options;
      
      console.log('stop');

      pocket = pockets[roulette.stopIndex];
      options = {
        duration: 100,
        loop: 5
      };

      pocket.animate(options).then(function() {
        Velocity(pocket.element, 'reverse', { duration: 0 });

        startButton.disabled = false;
      });
    }
  });

  startButton.addEventListener('click', function() {
    var options = {
      index: 0,
      delay: 0,
      duration: 75,
      loop: 1
    };

    startButton.disabled = true;
    stopButton.disabled = false;

    roulette.ready(options);
    roulette.start(options);
  }, false);

  stopButton.addEventListener('click', function() {
    stopButton.disabled = true;

    roulette.stop({
      stopIndex: 4,
      stepDuration: 10,
      stopThreshold: 300
    });
  }, false);

}());
