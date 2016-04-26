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
    
    // Your proxied Google spreadsheet goes here
    var key = '1I0QaErXTMHpTbPZvCCXrqg4tgsWsVTyGGLHRNsFGb1c', 
        archUrl = 'http://interactive.guim.co.uk/docsdata-test/'+key+'.json';

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
            headline = $('header.content__head h1'),
            standfirst = $('header.content__head .content__standfirst p'),
            byline = $('.content__main .content__meta-container.u-cf'),
            styleConfig = (dataConfig['style']) ? dataConfig['style'] : 'dark';

        if($(window).width() < 600){
            screenSize = "small";
        }

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

            excerptparagraphs = excerptparagraphs || [];

            row.excerpt = excerptparagraphs.filter(function(paragraph){
                return paragraph.length > 5;
            }) || "";
            return row;
        });

        



        if(headline.length > 0){
            headline = $(headline).get(0).textContent.split(':');
            title = headline[0];
            subtitle = headline[1];
        }else{
            headline = dataConfig.title;
        }

        standfirst = (standfirst.length > 0) ? $(standfirst).get(0).textContent : dataConfig.standfirst;
        byline = (byline.length > 0) ? $(byline).get(0).outerHTML : "";

        if(typeof window.guardian === "undefined"){
            isWeb = false;
        }
        console.log(imagePath)
        var templateData = { 
                style: styleConfig,
                rows: dataRows,
                title: title,
                subtitle:subtitle,
                standfirst: standfirst + " (Click through to read the full interviews)",
                screenSize: screenSize,
                byline: byline,
                isWeb: isWeb,
                imagePath: imagePath
            },
            pageHtml = Mustache.render(template, templateData);
        
        console.log(templateData)

        $('.element-interactive.interactive').html(pageHtml);

        $('.collapseButton').on('click', function(e){
            e.preventDefault();
            expandText(e);
        });

        lazyLoad();
        colourShift(container);

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
            element.className += " img-loaded";
          }
        });
    };

    // HELPER FUNCTION 
    function sluggify(str) {
        var regPat = /[^a-zA-Z0-9_-]/g;
        var slug = str.toLowerCase().trim().replace(regPat,'-');
        return slug; 
    };
    
    return {
        init: init
    };
});
