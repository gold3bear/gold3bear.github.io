/* xiongyongxin@gmail.com
 *  2015年01月12日18:08:41
 * */

require.config({
    baseUrl:"scripts",
    paths: {
        TweenMax: 'TweenMax.min',
        jquery:'jquery.min',
        ScrollMagic: 'jquery.scrollmagic.min',
        "ScrollMagic.debug": 'jquery.scrollmagic.debug',
        "Modernizr": 'modernizr',
        IScroll:'iscroll-probe'
    },
    shim: {
        'Modernizr': {
            exports: 'Modernizr'
        }
    }
});

require(['jquery','TweenMax', 'ScrollMagic','Modernizr','IScroll',"ScrollMagic.debug"],function($,tm,sm,Modernizr){
        $.when( $('#page-loader').addClass('out')).done(function () {
            $('#content-wrapper').addClass('in');
        });
        // init controller
        var controller = new sm.Controller({container: "#example-wrapper"});
        /* 出场,撤离提示文字迅速 */
        var tween0 = tm.to("#description", 1, {top: -400,ease: Circ.easeInOut});
        var scene0 = new sm.Scene({triggerElement: "#titlechart", duration:200,offset:300})
            .setTween(tween0)
            .addTo(controller);

        var tween1 = tm.fromTo('#start .chart',1,{opacity:0, ease: Circ.easeInOut},{opacity:1});
        var scene = new sm.Scene({triggerElement: "#trigger",offset:200})
            .setTween(tween1)
            .setPin("#body")
            .addTo(controller);

        var scene2 = new sm.Scene({triggerElement: "#trigger", offset: 300});
        TweenLite.defaultOverwrite = false;

        /**
         * 给道具中的数据，放到对话框中
         * 让用户点击道具，产生对话框
         * */
        $('.prop').on('click',function(){
            //获取data-dialog数据
            var dialogContent = $(this).data('dialog');
            //把数据绑定到对话框中
            var dialogBox = $('<div>').append(dialogContent).attr('id','dialog');
            //放到指定位置；
            var position = $('section#start');
            if(position.children('#dialog')){
                $('#dialog').remove();
            }
            position.append(dialogBox);
            window.setTimeout(function(){
                $('#dialog').remove();
            },3500);
        });
        /* 导演 */
        var director = {
            elementTemp:{},
            clothElementCache:[],
            propElementCache:[],
            timeLine: {},
            scene: {},
            /* {triggerElement: object, offset: int}) */
            triggerObject: {},
            createTimeLine: function () {
                this.timeLine = new TimelineMax();
                return this;
            },
            createScene: function (triggerObject) {
                this.scene = new sm.Scene(triggerObject)
                    .setTween(this.timeLine)
                    .addTo(controller)
                    .addIndicators();
                return this;
            },
            /* leftPosition,topPosition 来的位置*/
            wear: function (clothElement,leftPosition,topPosition) {
                var lPosition = leftPosition ? leftPosition : 400,
                    tPosition =  topPosition ? topPosition : -100;

                this.elementTemp = document.querySelector(clothElement);
                this.elementTemp.leftStatus = {opacity: 0, left: lPosition,  ease: Circ.easeOut};
                this.timeLine.add( tm.fromTo(this.elementTemp, 1, this.elementTemp.leftStatus,{opacity:1,left:0}));
                var length = this.clothElementCache.push(this.elementTemp);
                return this;
            },

            showAside: function(textElement,leftPosition,topPosition){
                TweenLite.set(textElement, {perspective:400});
                var aside = textElement+" li";
                this.timeLine.add(
                    tm.fromTo(textElement,1,{ opacity:0, y:-50,height:'2em'},{opacity:1,y:0,height:'100%',ease:Circ.easeOut}))
                    .add(
                    tm.staggerFromTo(aside,1,{opacity:0, scale:0, y:30},{opacity:1, scale:1, y:0,  ease:Back.easeOut}, 0.5, "+=0")
                );
                return this;
            },
            bringProp:function(propElement){
                var props = this.propElementCache = document.querySelectorAll(propElement);
//            console.log(props);
                this.timeLine.add(
                    tm.staggerFromTo(props,4,{opacity:0, y:100, scale:0,rotation:180}, {opacity:1, scale:1,y:220, rotation:0, ease:Back.easeOut},0.5, "+=30") )
                    .add(
                    tm.to(props, 4, {opacity:0,y:-100, ease:Linear.easeIn,delay:10})

                );
                return this;
            },
            takeProps: function(){
                this.timeLine.add(
                    tm.to(this.propElementCache, 1, {opacity:0,y:-300,ease:Expo.easeIn})
                );
                this.propElementCache = [];
                return this;
            },
            bringContact:function(titleElement){
                var title = document.querySelectorAll(titleElement);
                var lis = document.querySelectorAll(titleElement+' li');
                this.timeLine.add(
                    tm.fromTo(title,1,{ opacity:0, x:300},{opacity:1,x:0})
                ).add(
                    tm.staggerFromTo(lis,1,{opacity:0, scale:0, y:0},{opacity:1, scale:1, y:30,  ease:Back.easeOut}, 0.5, "+=0")
                );
                return this;
            }
        };

        /* 穿dribbble 的服饰*/
        director.createTimeLine()
            .wear('.basket-uniform')
            .wear('.basket-short',-400,60)
            .showAside('#designer .title-chart')
            .createScene({triggerElement: "#designer > .wear",duration: 400});
        /*道具*/
        director.createTimeLine()
            .bringProp('#designer .prop')
            .createScene({triggerElement: "#designer > .bring-props",duration: 300});

        /* 穿github 的服饰*/
        director.createTimeLine()
            .wear('.git-shirt')
            .wear('.git-short',-400,60)
            .showAside('#coder .title-chart')
            .createScene({triggerElement: "#coder > .wear",duration: 400});
        /*道具*/
        director.createTimeLine()
            .bringProp('#coder .prop')
            .createScene({triggerElement: "#coder > .bring-props",duration: 300});

        /* 穿PM的服饰*/
        director.createTimeLine()
            .wear('.pm-shirt')
            .wear('.pm-short',-400,60)
            .showAside('#pm .title-chart')
            .createScene({triggerElement: "#pm > .wear",duration: 200});
        director.createTimeLine()
            .bringProp('#pm .prop')
            .createScene({triggerElement: "#pm > .bring-props",duration: 300});
        // make sure we only do this on mobile:
        director.createTimeLine()
            .bringContact('#contact .title')
            .createScene({triggerElement: "#contact",duration: 200,offset:100});
        if (Modernizr.touch) {
            // configure iScroll
            var myScroll = new IScroll('#example-wrapper',
                {
                    // don't scroll horizontal
                    scrollX: false,
                    // but do scroll vertical
                    scrollY: true,
                    // show scrollbars
                    scrollbars: true,
                    // deactivating -webkit-transform because pin wouldn't work because of a webkit bug: https://code.google.com/p/chromium/issues/detail?id=20574
                    // if you dont use pinning, keep "useTransform" set to true, as it is far better in terms of performance.
                    useTransform: false,
                    // deativate css-transition to force requestAnimationFrame (implicit with probeType 3)
                    useTransition: false,
                    // set to highest probing level to get scroll events even during momentum and bounce
                    // requires inclusion of iscroll-probe.js
                    probeType: 3,
                    // pass through clicks inside scroll container
                    click: true
                }
            );

            // overwrite scroll position calculation to use child's offset instead of container's scrollTop();
            controller.scrollPos(function () {
                return -myScroll.y;
            });

            // thanks to iScroll 5 we now have a real onScroll event (with some performance drawbacks)
            myScroll.on("scroll", function () {
                controller.update();
            });

            // add indicators to scrollcontent so they will be moved with it.
        } else {
            // show indicators (requires debug extension)
//        scene.addIndicators();
        }

});



