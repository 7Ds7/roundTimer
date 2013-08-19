var roundTimer = {
  init: function( options, elem ) { 
    // Mix in the passed-in options with the default options
    this.options = $.extend( {}, this.options, options, $(elem).data( 'roundtimer-options') );
    // Save the element reference, both as a jQuery
    // reference and a normal reference
    this.elem  = elem;
    this.$elem = $(elem);
    

    // Build the DOM's initial structure
    this._build();

    // return this so that we can chain and use the bridge with less code.
    return this;
  },
  options: {
    size: 20,
    start_date: 0,
    end_date: 0,
    relation: 0,
    anti_clockwise: false,
    now_date: new Date().getTime(),
    velocity: 1.5,
    auto_anim: true,
    text_template: '<div class="text-wrapper" style="position: relative;top:0;left:0;"><div class="timer-text" style="width:200px; text-align:center; position:absolute;"><span class="number" style="font-size: 35px;">00</span><span class="word" style="font-size:30px"></span></div></div>',
    // Properties not to be passed to instance
    max_angle: 0,
    inc_angle: 0,
    mil_anim: 0
    
  },
  
  _build: function(){
     console.log('_build');
    
    // Centers the main element
    this.$elem.css({
      'width': this.options.size+'px', 
       'margin': '0 auto'}
       );

    this.$elem.append( this.options.text_template );
    this.$elem.find('.timer-text').css('top', parseInt(this.options.size / 2 - 19 ) + 'px'); //size minus half the font-size
    this.$elem.find('.timer-text').css('width', this.options.size + 'px');
    this.$elem.find('.timer-text').css('color', this.options.color);

    this.$elem.append('<canvas style="border: 1px solid #656561; border-radius:'+this.options.size+'px" class="canvas-timer" width="'+this.options.size+'" height="'+this.options.size+'"></canvas>');
     
    // Build global drawables
    this.canvas = this.$elem.find('canvas')[0];
    this.arc_radius = this.options.size / 3; // canvas.width / 3
    this.arc_bg = this.canvas.getContext('2d');
    this.arc_percentage = this.canvas.getContext('2d');
    this.arc_percentage.translate(this.options.size/2, this.options.size/2);
    this.arc_percentage.rotate( 270 * Math.PI / 180);
    this.arc_percentage.translate( -this.options.size / 2, -this.options.size / 2 ); // Move registration point back to the top left corner of canvas
    this.today_indicator = this.canvas.getContext('2d');
    
    this.options.max_angle = 0;
    this.options.inc_angle = 0;
    
    this._calcRelation('initial');
    this._drawCanvas();
    this._calcRemainingText();
  },
  
  /*
  * CALCULATE REMAINING TIME 
  * AND ADD TO TEXT ELEMENT
  * params in new Date() format
  */
  _calcRemainingText: function() {
    
    var remaining =  ( this.options.end_date - this.options.now_date ) / ( 1000 * 60 * 60 * 24 ) ;
    var text = '';
    console.log ( remaining );
    
    var nd = new Date( this.options.now_date );
    var ed = new Date( this.options.end_date) ;

    // Discard the time and time-zone information.
    var nd = new Date();
    var ed = new Date( this.options.end_date) ;
    var now_date_utc = Date.UTC( nd.getFullYear(),nd.getMonth(), nd.getDate(), nd.getHours(), nd.getMinutes() );
    var end_date_utc = Date.UTC( ed.getFullYear(), ed.getMonth(), ed.getDate(), ed.getHours(), ed.getMinutes() );
    var _MS_PER_DAY = 1000 * 60 * 60 * 24 ;
    //console.log('WOOT');
    //console.log( Math.floor((end_date_utc - now_date_utc) / _MS_PER_DAY) );
  
    switch ( true ) {
      case remaining < 0.0009:
         text = 's';
         remaining = Math.floor( ( this.options.end_date - this.options.now_date ) / ( 1000 ) );
         if ( remaining < 0 ) {
           remaining = 0;
         }
         //remaining = ( Math.round( remaining * 100 ) / 100 ) * 100; // Get the first decimal value which represents hours
         this.options.mil_anim = 1000
         //console.log('SECONDS');
         break;
      case remaining < 0.09:
        text = 'm';
        remaining = Math.floor( ( this.options.end_date - this.options.now_date ) / ( 1000 * 60 ) );
        //console.log('MINUTES');
        this.options.mil_anim = 60000;
        break;
      case remaining < 0.99:
        text = 'h';
        remaining = Math.floor( ( this.options.end_date - this.options.now_date ) / ( 1000 * 60 * 60 ) );
        this.options.mil_anim = 3600000;
       // console.log('HOURS');
        break;
      case remaining >= 1:
        text = 'd';
        remaining = Math.floor( ( this.options.end_date - this.options.now_date ) / ( 1000 * 60 * 60 * 24 ) );
        this.options.mil_anim = 86400000;
       // console.log('DAYS');
        break;
        
    }
    
    //console.log(remaining);
    
    if ( remaining > 0 ) {
      this.$elem.find('.timer-text .number').html( ' ' + remaining );
      this.$elem.find('.timer-text .word').html( ' ' + text );
      
    }else {
      this.$elem.find('.timer-text .number').html( '  ' );
      this.$elem.find('.timer-text .word').html( ' Time Out ' );
    }
  },
  
  
  /*
  * CALCULATE RELATION 
  * TIME -> ANGLE
  */
  _calcRelation: function( state ) {
    //console.log('_calcRelation');
    switch(state) {
      case 'initial':
        this.options.relation = 360 - ( ( this.options.end_date - this.options.start_date ) * 360 )  / ( this.options.end_date - this.options.start_date ) // notice start_date to set angle to 0 | 360 - is to invert arc slice  
        break;
      case 'days':
        this.options.relation = 360 - ( ( this.options.end_date - this.options.now_date ) * 360 )  / ( this.options.end_date - this.options.start_date ) // notice start_date to set angle to 0 | 360 - is to invert arc slice   
        this.options.max_angle = this.options.relation;
        console.log(this.options.relation);
        break;
      case 'increment':
        this.options.relation = this.options.inc_angle - 360// notice start_date to set angle to 0 | 360 - is to invert arc slice 
    }
    this.angle_percentage = this.options.relation * Math.PI / 180;
  },
  
  
  /*
  * DRAW BACKGROUND ARC
  */
  _drawArcBg: function() {
    /* GRAY BG ARC */
    this.arc_bg.beginPath();
    this.arc_bg.arc( this.options.size / 2, this.options.size / 2, this.arc_radius, 0, 360 * Math.PI / 180, this.options.anti_clockwise );
    this.arc_bg.lineWidth = 20;
    this.arc_bg.strokeStyle = 'gray';
    this.arc_bg.stroke();
  },
  
  /*
  * DRAW PERCENTAGE ARC
  */
  _drawArcPercentage: function() {
    /* PERCENTAGE ARC */
    
    this.arc_percentage.beginPath();
    this.arc_percentage.arc( this.options.size / 2, this.options.size  / 2, this.arc_radius, 0, this.angle_percentage , this.options.anti_clockwise );
    this.arc_percentage.lineWidth = 20;
    this.arc_percentage.strokeStyle = this.options.color;
    
    if ( this.options.max_angle >= 360 )
      this.arc_percentage.strokeStyle = '#f2958f';
    
    this.arc_percentage.stroke();
  },
  
  /*
  * CALCULATE CURRENT DAY INDICATOR
  */  
  _drawTodayIndicator: function() {
    /* TODAY INDICATOR */
    this.today_indicator.beginPath();
    var x_end = this.options.size  / 2  + this.arc_radius * Math.cos( this.angle_percentage );
    var y_end = this.options.size  / 2  + this.arc_radius * Math.sin( this.angle_percentage )
    this.today_indicator.rect( x_end - 7 , y_end - 7 , 14, 14 );
    this.today_indicator.fillStyle = 'yellow';
    this.today_indicator.fill();
  },
  
  /*
  * DRAW INITIAL CANVAS
  * AND CALL ANIMATION
  */
  _drawCanvas: function(){
    console.log('_drawCanvas');
    this._drawArcBg();
    this._drawArcPercentage();
    this._drawTodayIndicator();
    this._calcRelation('days');
    this._animateFps();
  },
  
  /*
  * ANIMATE FPS
  * INTERVAL BASED ON VELOCITY
  */
  _animateFps: function() {
    var base = this;
    this.interval = setInterval( function(){ 
      base.options.inc_angle += base.options.velocity;
      base._animate(this);
    }, 5);
  },
  
  /*
  * ANIMATE
  */
  _animate: function() {
    if ( this.options.inc_angle < this.options.max_angle ) {
      this._calcRelation('increment');
      this.arc_bg.clearRect( 0, 0, this.options.size, this.options.size ); // only one bg to clear
      this._drawArcBg();
      this._drawArcPercentage();
      this._drawTodayIndicator();
    } else {
      clearInterval(this.interval);
       if ( this.options.auto_anim ) {
         var base = this;
         clearInterval(this.auto_interval);
         base.auto_interval = setInterval( function() {
           base.options.now_date = new Date().getTime();
           base.arc_bg.clearRect( 0, 0, base.options.size, base.options.size ); // only one bg to clear
           base._calcRelation('days');
           base._calcRemainingText(); 
           base._drawArcBg();
           base._drawArcPercentage();
           base._drawTodayIndicator();
           if ( base.options.max_angle >= 360 ) {
             clearInterval(base.auto_interval);
             base.arc_bg.clearRect( 0, 0, base.options.size, base.options.size ); // only one bg to clear
             base._calcRelation('days');
             base._calcRemainingText(); 
             base._drawArcBg();
             base._drawArcPercentage();
           }
         }, this.options.mil_anim);
          } 
    }
  },
  
  
  testMethod: function( msg ){
    // You have direct access to the associated and cached
    // jQuery element
    console.log(this.$elem);
    console.log(msg);
  }
};


// Object.create support test, and fallback for browsers without it
if ( typeof Object.create !== 'function' ) {
    Object.create = function (o) {
        function F() {}
        F.prototype = o;
        return new F();
    };
}


// Create a plugin based on a defined object
$.plugin = function( name, object ) {
  $.fn[name] = function( options ) {
    return this.each(function() {
      if ( ! $.data( this, name ) ) {
        $.data( this, name, Object.create(object).init( 
        options, this ) );
      }
    });
  };
};

// Usage:
// With roundTimer, we could now essentially do this:
$.plugin('roundtimer', roundTimer);

// and at this point we could do the following
$('#round-timer').roundtimer(); 
var timer_instance = $('#round-timer').data('roundtimer');
//inst._render('I am a method');




// Do this as interval to update on each instance
/*window.setTimeout(function(){
  console.log('out');
  a.options.now_date = new Date(2013,07,15, 01, 00, 00).getTime();
  a._calcRelation('days');
  a._calcRemainingText(); 
  a._animateFps();
}, 3000);*/


//inst.myMethod('I am a method');

/*window.requestAnimFrame = (function(){
  return  window.requestAnimationFrame       ||
          window.webkitRequestAnimationFrame ||
          window.mozRequestAnimationFrame    ||
          function( callback ){
            window.setTimeout(callback, 1000 / 60); 
          };
})();*/

/*(function animloop(){
  requestAnimFrame(animloop);
  if ( inst.inc_angle < inst.max_angle ) {
   inst.inc_angle += 1;
   inst._animate();
  }
  
})();*/
