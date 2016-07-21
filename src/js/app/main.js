define([
    'reqwest',
    'jquery',
    'mustache',
    'lazyload',
    'text!templates/appTemplate.html',
    'views/analytics',
    'iframeMessenger',
    '../libs/jquery.color.min.js'
], function(
    reqwest,
    $,
    Mustache,
    lazy,
    template,
    ga,
    iframeMessenger
) {
   'use strict';
    // http://interactive.guim.co.uk/docsdata-test/1nDXpsJ5Tf2JF5CfCxL-7vZRpq1OM04tG-09Owyh4bHU.json
    // Your proxied Google spreadsheet goes here
    var key = '1nDXpsJ5Tf2JF5CfCxL-7vZRpq1OM04tG-09Owyh4bHU', 
        archUrl = 'https://interactive.guim.co.uk/docsdata-test/'+key+'.json';

    var config;

    function init(el, context, config, mediator) {
        // DEBUG: What we get given on boot
        // console.log(el, context, config, mediator);
        getData(el, archUrl);
    };

    function getData(el, url){
        reqwest({
            url: url,
            type: 'json',
            crossOrigin: true
        })
        .then(function(data){
            launchApp(el, data);
        })
        .fail(handleRequestError);

        function handleRequestError(err, msg) {
            console.error('Failed: ', err, msg);
        }
    };

    function cleanData(data) {
        data.rows.forEach(function(block) {
            if (block.hasOwnProperty('copy')) {
                 block.copy = block.copy.replace(/[\r\n]+/g, '\n').split('\n');
            }
        });
        return data;
    };

    function launchApp(el, data) {
        render(cleanData(data));
        // Enable iframe resizing on the GU site
        iframeMessenger.enableAutoResize();
    };


    function render(data) {
        $('.l-side-margins').addClass('interactiveStyling');
        $('#article-body').addClass('interactivePadding');

        var container = document.getElementById("colour-shift-container");

        var isWeb = true,
            screenSize = "big",
            projectByline = data['byline'],
            dataConfig = data.config,
            imagePath = dataConfig.path,
            title = dataConfig.title,
            subtitle = dataConfig.subtitle,
            standfirst = dataConfig.standfirst,
            byline = dataConfig.byline,
            styleConfig = (dataConfig['style']) ? dataConfig['style'] : 'dark';

        if($(window).width() < 600){
            screenSize = "small";
        }

        config = data.config;

        var dataRows = data.rows.map(function(row, i){
            var paragraphs = (row.fulltext) ? row.fulltext.split('\n') : "",
                excerptparagraphs = (row.excerpt) ? row.excerpt.split('\n') : false;

            // row.clr = clrs[i];
            row.align = (row.align) ? "align-"+row.align : "";
            row.rowClass = (row.class) ? row.class : false;
            row.caption = (row.caption) ? row.caption.split(/\n/) : "";
            row.isRow = (row.rowClass !== "outro") ? true : false;
            
            paragraphs = paragraphs.map(function(paragraph){
                return paragraph.replace(/^::/g, "<strong>").replace(/::$|::\s$/, "</strong>");
            });

            row.fulltext = paragraphs.filter(function(paragraph){
                return paragraph.length > 5;
            });

            row.firstParagraph = row.fulltext[0];
            row.fulltext.shift()
            excerptparagraphs = excerptparagraphs || [];

            row.excerpt = excerptparagraphs.filter(function(paragraph){
                return paragraph.length > 5;
            }) || "";
            return row;
        });


        if(typeof window.guardian === "undefined"){
            // isWeb = false;
        }

        console.log(config.credits)
        
        var templateData = { 
            credits: config.credits,
            style: styleConfig,
            rows: dataRows,
            title: title,
            subtitle:subtitle,
            standfirst: standfirst,
            screenSize: screenSize,
            byline: byline,
            isWeb: isWeb,
            imagePath: imagePath
        },pageHtml = Mustache.render(template, templateData);
        

        $('.element-interactive.interactive').html(pageHtml);

        $('.collapseButton').on('click', function(e){
            e.preventDefault();
            expandText(e);
        });

        $('.share-button').on('click',function(e){
            share(e)
        })

        lazyLoad();
        // colourShift(container);

        return this;
    };

    function expandText(e){
        var state = $(e.currentTarget).attr('data-toggle');
        
        if(state==="readMore"){
            trackEvent(e);
            $(e.currentTarget).closest('.rowContainer').addClass('active');
        }else{
            if($(window).width()<960){
                updateScrollposition(e);
            }else{
                $(e.currentTarget).closest('.rowContainer').removeClass('active');
            }
        }
    };

    function colourShift(bod){
        var imgEl;
        var clrs = [
            "#ff0000",
            "#ff8000",
            "#ffbf00",
            "#80ff00",
            "#00ffff",
            "#00bfff",
            "#0080ff",
            "#8000ff",
            "#bf00ff",
            "#ff00bf",
            "#ff0080",
            "#ff0040"
        ];
        
        // bod.style.backgroundColor = imgEl.dataset.clr;
        // window.addEventListener("scroll", function(){
        //     console.log("scrollin'");
        // });

        var scroll_pos = 0;
        var animation_begin_pos = 0; //where you want the animation to begin
        var animation_end_pos = bod.offsetHeight; //where you want the animation to stop
        var beginning_color = new $.Color( 'rgb(210,50,98)' ); //we can set this here, but it'd probably be better to get it from the CSS; for the example we're setting it here.
        var ending_color = new $.Color( 'rgb(0,197,209)' ); ;//what color we want to use in the end

        $(document).scroll(function(){
            scroll_pos = $(this).scrollTop(); 
            if(scroll_pos >= animation_begin_pos && scroll_pos <= animation_end_pos ) { 

                //we want to calculate the relevant transitional rgb value
                var percentScrolled = scroll_pos / ( animation_end_pos - animation_begin_pos );
                var newRed = beginning_color.red() + ( ( ending_color.red() - beginning_color.red() ) * percentScrolled );
                var newGreen = beginning_color.green() + ( ( ending_color.green() - beginning_color.green() ) * percentScrolled );
                var newBlue = beginning_color.blue() + ( ( ending_color.blue() - beginning_color.blue() ) * percentScrolled );
                var newColor = new $.Color( newRed, newGreen, newBlue );

                $(bod).animate({ backgroundColor: newColor }, 0);

            } else if ( scroll_pos > animation_end_pos ) {
                $(bod).animate({ backgroundColor: ending_color }, 0);

            } else if ( scroll_pos < animation_begin_pos ) {
                $(bod).animate({ backgroundColor: beginning_color }, 0);

            } else { }
        });

    };

    function updateScrollposition(event){
        var elScrolltop = $(event.currentTarget).offset().top,
            currentScrollHeight = $(window).scrollTop(),
            difference = elScrolltop - currentScrollHeight;

        $(event.currentTarget).closest('.rowContainer').removeClass('active');
        
        elScrolltop = $(event.currentTarget)
            .closest('.rowContainer')
            .find('.descriptionShort .collapseButton')
            .offset().top;

        window.scrollTo(0,elScrolltop - difference);
    };

    function trackEvent(e){
        var rowId = $(e.currentTarget).attr('data-row');
        window.ga('send', {
          'hitType': 'event',          // Required.
          'eventCategory': 'readmore',   // Required.
          'eventAction': 'click',      // Required.
          'eventLabel': rowId
        });
    };

    function lazyLoad(){
        lazy.init({
          offset: 800,
          throttle: 250,
          unload: false,
          callback: function (element, op) {
            var img = element,
                containingDiv = img.parentNode;

            img.className += " img-loaded";
            containingDiv.className += " contains-loaded-img";
            if (containingDiv.id == "wrap-gv-tgb-ellie-simmonds"){
                img.src = "{{assets}}/imgs/real/gv-tgb-ellie-simmonds-big.png"
            }
            // img.style.opacity = 0;
          }
        });
    };

    // HELPER FUNCTION 
    function sluggify(str) {
        var regPat = /[^a-zA-Z0-9_-]/g;
        var slug = str.toLowerCase().trim().replace(regPat,'-');
        return slug; 
    };

    function share(e){
        var btn = e.target;
        var shareWindow;
        var twitterBaseUrl = "http://twitter.com/share?text=";
        var facebookBaseUrl = "https://www.facebook.com/dialog/feed?display=popup&app_id=741666719251986&link=";
        var shareImage = "";
        var shareUrl = config.shareUrl;
        var shareMessage = config.sharetext;
        console.log(config)

        if(btn.className.indexOf('share-twitter') > -1){
            shareWindow = twitterBaseUrl + 
                            encodeURIComponent(shareMessage) + 
                            "&url=" + 
                            encodeURIComponent(shareUrl);

        } else if( btn.className.indexOf('share-facebook') > -1 ){
            shareWindow = facebookBaseUrl + 
                            encodeURIComponent(shareUrl) + 
                            "&picture=" + 
                            encodeURIComponent(shareImage) + 
                            "&redirect_uri=http://www.theguardian.com";
        }

        window.open(shareWindow, "Share", "width=640,height=320"); 
    }
    
    return {
        init: init
    };
});
