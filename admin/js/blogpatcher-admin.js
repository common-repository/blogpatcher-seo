( function( wp ) {

    // var registerPlugin = wp.plugins.registerPlugin;
    // var PluginSidebar = wp.editPost.PluginSidebar;
    // var el = wp.element.createElement;
    // var counter = 0;
    //
    // $(document).ready(function () {
    //     var tmpTitle = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'title' );
    //     console.log(">title="+tmpTitle);
    //     // console.log("F>title="+getTitleReact());
    // });

    window.getTitleReact = function(){
      return wp.data.select( 'core/editor' ).getEditedPostAttribute( 'title' );
    }


} )( window.wp );





(function ($, window, document) {
    'use strict';

    const abbrvNoEOS = Object.create( null );
    abbrvNoEOS[ 'mr.' ] = true;
    abbrvNoEOS[ 'mrs.' ] = true;
    abbrvNoEOS[ 'ms.' ] = true;
    abbrvNoEOS[ 'er.' ] = true;
    abbrvNoEOS[ 'dr.' ] = true;
    abbrvNoEOS[ 'miss.' ] = true;
    abbrvNoEOS[ 'shri.' ] = true;
    abbrvNoEOS[ 'smt.' ] = true;
    abbrvNoEOS[ 'i.e.' ] = true;
    abbrvNoEOS[ 'ie.' ] = true;
    abbrvNoEOS[ 'e.g.' ] = true;
    abbrvNoEOS[ 'eg.' ] = true;
    abbrvNoEOS[ 'viz.' ] = true;
    abbrvNoEOS[ 'pvt.' ] = true;
    abbrvNoEOS[ 'et.' ] = true;
    abbrvNoEOS[ 'al.' ] = true;
    abbrvNoEOS[ 'mt.' ] = true;
    abbrvNoEOS[ 'pp.' ] = true;
    const abbrvMayBeEOS = Object.create( null );
    abbrvMayBeEOS[ 'inc.' ] = true;
    abbrvMayBeEOS[ 'ltd.' ] = true;
    abbrvMayBeEOS[ 'al.' ] = true;
    // Regex to test potential End-Of-Sentence.
    const rgxPotentialEOS = /\.$|\!$|\?$/;
    // Regex to test special cases of "I" at eos.
    const rgxSplI = /i\?$|i\!$/;
    // Regex to test first char as alpha only
    const rgxAlphaAt0 = /^[^a-z]/i;

    var isGutenberg;

    var wpBlockIds = [];

    var stopWords = ["a", "about", "above", "after", "again", "against", "all", "am", "an", "and", "any",
          "are", "as", "at", "be", "because", "been", "before", "being", "below", "between", "both", "but",
          "by", "could", "did", "do", "does", "doing", "down", "during", "each", "few", "for", "from", "further",
          "had", "has", "have", "having", "he", "he’d", "he’ll", "he’s", "he'd", "he'll", "he's", "her", "here",
          "here’s", "here's", "hers", "herself",
          "him", "himself", "his", "how", "how’s", "how's", "i", "i’d", "i’ll", "i’m", "i’ve", "i'd", "i'll", "i'm",
          "i've", "if", "in", "into", "is", "it",
          "it's", "its", "it’s", "itself", "let’s", "let's", "me", "more", "most", "my", "myself", "nor", "of", "on", "once", "only",
          "or", "other", "ought", "our", "ours", "ourselves", "out", "over", "own", "same", "she", "she’d", "she’ll",
          "she’s", "should", "so", "some", "such", "than", "that", "that’s", "that's", "the", "their", "theirs", "them",
          "themselves", "then", "there", "there’s", "there's", "these", "they", "they’d", "they’ll", "they’re", "they’ve",
          "they'd", "they'll", "they're", "they've",
          "this", "those", "through", "to", "too", "under", "until", "up", "very", "was", "we", "we’d", "we’ll",
          "we’re", "we’ve", "we'd", "we'll",
          "we're", "we've", "were", "what", "what’s", "what's", "when", "when’s", "when's", "where", "where’s", "where's",
          "which", "while", "who", "who’s",
          "who's", "whom", "why", "why’s", "why's", "with", "would", "you", "you’d", "you’ll", "you’re", "you’ve", "you'd",
          "you'll", "you're", "you've", "your",
          "yours", "yourself", "yourselves"];

    var MAX_TITLE_LENGTH = 70;
    var MAX_META_LENGTH = 160;
    var MIN_TITLE_MATCH = 0.75;
    var WARN_TITLE_MATCH = 0.5;
    var MIN_H2_MATCH = 0.5;
    var WARN_H2_MATCH = 0.25;

    var iFrame = null;

    var GUTEN_READY = 'div.wp-block';
    var CLASSIC_READY = '#content_ifr';

    var GUTEN_DOC = 'div.editor-block-list__layout:first';
    var CLASSIC_DOC = '#tinymce';

    var GUTEN_BLOCK = 'div.wp-block';
    var CLASSIC_BLOCK = 'p';

    var lastTarget = null;
    var lastCarret = null;
    var iframes, node;
    var commonKw, avgKw;
    var related, ideas;
    var page, avgPage;
    var serp;
    var title;
    var doc;
    var h1s, h2s, links, images;
    var wordCount = 0;
    var exactMatch = 0;
    var syllablesCount = 0;
    var sentenceCount = 0;
    var felsch = 0;
    var wpBlockCount = 0;
    var linksCount = 0;
    var intLinksCount = 0;
    var extLinksCount = 0;
    var keywordInFirstParagraph = 0;
    var enterBlock = {id : "enter", words : 0, keywords : 0, sentences : 0, syllables : 0};
    var exitBlock = {id : "exit", words : 0, keywords : 0, sentences : 0, syllables : 0};
    var keywordUsage = {title : 0, h1 : 0, h2 : 0, meta: 0, exact: 0, alt : 0, src: 0, slug: 0};

    // function getEventsList(obj) {
    //   console.log("getting events list");
    //   var ev = new Array(),
    //       events = obj.data('events'),
    //       i;
    //   for(i in events) { console.log("using="+i); ev.push(i); }
    //   return ev.join(' ');
    // }

    //
    //hook everything up
    //
    function blogpatcherOnReady(){

      if(isGutenberg){
        //slug input is not always in the DOM
        $('#editor').on('DOMSubtreeModified', function(event) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          if( !$(document).find("span.edit-post-post-link__link-post-name").hasClass('hooked') ){
            //add hooked class to element so we can know it has a listener
            $(document).find("span.edit-post-post-link__link-post-name").addClass('hooked');
            $(document).find("span.edit-post-post-link__link-post-name").on('DOMSubtreeModified', function(event) {
              blogpatcherSlugChanged(event.target);
            });
          }
        });

        //hook title input
        $("#post-title-0").focusin(function(event) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          blogpatcherBlockEnter(event.target, event.delegateTarget);
        });

        $("#post-title-0").focusout(function(event) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          blogpatcherBlockExit(event.target);
          blogpatcherTitleChanged(event.target);
        });

        $('#blogpatcher_sidebar_counter').change(function(event) {

          // console.log("sidbar count");
          //check if visible, if so populate with labels of keywords
          // so, so, so.... hacky :(
          if(!$("#blogpatcher_sidebar_div").is(':visible')){
            // console.log("sidbar visible");
            var timesRun = 0;
            var checkExist2 = setInterval(function() {
              timesRun
                if ($("#blogpatcher_sidebar_div").is(':visible')) {
                  clearInterval(checkExist2);
                  blogpatcherUpdateSidebar();
                }
                if(timesRun === 20){
                  clearInterval(checkExist2);
                }
              }, 50);
          }
        });
      }
      else{//tinymce clasic editor

        //catch when the slug editor is in the DOM
        $('#titlediv').on('DOMSubtreeModified', function(event) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          if( !$(document).find("new-post-slug").hasClass('hooked') ){
            //add hooked class to element so we can know it has a listener
            $(document).find("#new-post-slug").addClass('hooked');
            $(document).find("#new-post-slug").focusout( function(event) {
              blogpatcherSlugChanged(event.target);
            });
          }
        });

        iframes = document.getElementsByTagName('iframe');

        $(doc).bind("keydown click focusin focusout", function(e) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          // console.log(e);
          if(e.type == "focusout"){
            // console.log("OUT");
            if(lastCarret != null){
              //trigger exit in block we where in
              blogpatcherBlockExit(lastCarret);

              if( $(lastCarret).is("h1") )
                blogpatcherH1Changed(lastCarret);
              else if( $(lastCarret).is("h2") )
                blogpatcherH2Changed(lastCarret);
              else if( $(lastCarret).is("img"))
                blogpatcherImageChanged();
              else
                blogpatcherParaChangedTinymce(lastCarret);

            }
            //no block entered, focuse is outside of editor
            lastCarret = null;
          }
          else{
            var tmpCarret = getSelectionStart();
            //changed block?
            if(lastCarret != tmpCarret){
                // console.log("Before: "+$(lastCarret).html() + " After: "+$(tmpCarret).html());
                if(lastCarret != null){
                  //trigger exit in block we where in
                  blogpatcherBlockExit(lastCarret);

                  if( $(lastCarret).is("h1") )
                    blogpatcherH1Changed(lastCarret);
                  else if( $(lastCarret).is("h2") )
                    blogpatcherH2Changed(lastCarret);
                  else if( $(lastCarret).is("img"))
                    blogpatcherImageChanged();
                  else
                    blogpatcherParaChangedTinymce(lastCarret);
                }
                //trigger enter on new block
                blogpatcherBlockEnter(tmpCarret, event.delegateTarget);
                lastCarret = tmpCarret;
            }
          }
        });

        // look for children added or removed, we have to recalc dispatchEvent
        wpBlockCount = doc[0].children.length;

        // The node to be monitored

        // Create an observer instance
        var observer = new MutationObserver(function( mutations ) {

          mutations.forEach(function( mutation ) {

            if( !blogpatcherIsRealtimeSEO() )
              return;

            var newNodes = mutation.addedNodes; // DOM NodeList
            if( newNodes !== null ) { // If there are new nodes added

            	$.each(newNodes, function(i, v) {
                //DIV is when copy paste adds a temp element
                if(v.tagName != 'DIV'){
                  var tmp = doc[0].children.length;

                    if(tmp != wpBlockCount){
                      // console.log("DOM Children changed, before: "+wpBlockCount+", after: "+tmp+", event: "+event.type);

                      wpBlockCount = tmp;

                      //set lastCarret to null so we do not trigger block exit
                      lastCarret = null;
                      //re-calculate whole page
                      blogpatcherDisplaySEO(false);
                    }
                }


            	});
            }
            var removedNodes = mutation.removedNodes; // DOM NodeList
            if( removedNodes !== null ) {
              $.each(removedNodes, function(i, v) {
                if(v.tagName != 'DIV'){
                  var tmp = doc[0].children.length;

                    if(tmp != wpBlockCount){
                      // console.log("DOM Children changed, before: "+wpBlockCount+", after: "+tmp+", event: "+event.type);

                      wpBlockCount = tmp;

                      //set lastCarret to null so we do not trigger block exit
                      lastCarret = null;
                      //re-calculate whole page
                      blogpatcherDisplaySEO(false);
                    }
                }


            	});
            }
          });

        });

        // Configuration of the observer:
        var config = {
        	attributes: true,
        	childList: true,
        	characterData: true
        };

        // Pass in the target node, as well as the observer options
        observer.observe(doc[0], config);

        //hook title input
        $("#title").focusin(function(event) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          if(lastCarret != null)
            blogpatcherBlockExit(lastCarret);
          blogpatcherBlockEnter(event.target, event.delegateTarget);
        });

        $("#title").focusout(function(event) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          blogpatcherBlockExit(event.target);
          blogpatcherTitleChanged(event.target);
        });

        //hook meta input
        $("#wtt_description").focusin(function(event) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          if(lastCarret != null)
            blogpatcherBlockExit(lastCarret);
          blogpatcherBlockEnter(event.target, event.delegateTarget);
        });

        $("#wtt_description").focusout(function(event) {

          if( !blogpatcherIsRealtimeSEO() )
            return;

          blogpatcherBlockExit(event.target);
          blogpatcherMetaChanged(event.target);
        });
      }


      //listen to changes in entered focus keyword
      $('#blogpatcher_page_keyword').focusout(function(){

        blogpatcherDisplaySEO(true);

      });

      //listen to changes to blocks
      //both focusin and focusout
      isGutenberg ? blogpatcherHookBlocks() : blogpatcherHookTinymce();

      //initial calculations
      blogpatcherDisplaySEO(true);

    }

    function getSelectionStart() {

      node = iframes[0].contentWindow.getSelection().anchorNode;
      // console.log("carret is in node: "+node);
      if(node != null)
        return (node.nodeType == 3 ? node.parentNode : node);
      else
        return null;

    }

    // execute when the DOM is ready
    $(document).ready(function () {
        // console.log("Blogpatcher admin scripts loading...");

        if(document.body.classList.contains( 'block-editor-page' )){
          isGutenberg = true;
        }
        else{
          isGutenberg = false;
        }
        console.log("Is Gutenberg="+isGutenberg);

        // // Load the Visualization API library and the piechart library.
        // $.getScript( "../wp-content/plugins/blogpatcher-seo/admin/js/blogpatcher-jsapi.js", function( data, textStatus, jqxhr ) {
        //   console.log( data ); // Data returned
        //   console.log( textStatus ); // Success
        //   console.log( jqxhr.status ); // 200
        //   console.log( "Load was performed." );
        // });

        $.getScript("https://www.gstatic.com/charts/loader.js").done(function(script, textStatus) {
          // console.log("finished loading and running test.js. with a status of" + textStatus);
          // google.load('visualization', '1.0', {'packages':['corechart']});
          google.charts.load('current', {packages: ['corechart']});
        });

        var checkExist = setInterval(function() {
            // console.log("Waiting for document. . .");

            if ($(isGutenberg ? GUTEN_READY : CLASSIC_READY).length) {
              // console.log("Ready");

              if(!isGutenberg){

                  doc = $(CLASSIC_READY).contents().find(CLASSIC_DOC);
                  blogpatcherOnReady();

              }
              else{
                doc = $(isGutenberg ? GUTEN_DOC : CLASSIC_DOC);
                blogpatcherOnReady();
              }

              clearInterval(checkExist);
            }

          }, 100);

          // GUI click listeners
        $('#blogpatcher_page_submit').click( function() { blogpatcherGetPageData(); } );

        $('#bp_real_time_lsi').click( function() { blogpatcherRealtimeLSIChanged(); } );
        blogpatcherRealtimeLSIChanged();

        $('#bp_real_time_seo').click( function() { blogpatcherRealtimeSEOChanged(); } );
        blogpatcherRealtimeSEOChanged();

        $('#blogpatcher_keyword_analysis_submit').click( function() { blogPatcherGetKeywordData() } );

        $('#blogpatcher-tablinks-main').click( function(e) {blogpatcherOpenTab(e.currentTarget, 'blogpatcher-tab-main')} );

        $('#blogpatcher-tablinks-seo').click( function(e) {blogpatcherOpenTab(e.currentTarget, 'blogpatcher-tab-seo')} );

        $('#blogpatcher-tablinks-keywords').click( function(e) {blogpatcherOpenTab(e.currentTarget, 'blogpatcher-tab-keywords')} );

        $('#blogpatcher-tablinks-competitors').click( function(e) {blogpatcherOpenTab(e.currentTarget, 'blogpatcher-tab-competitors'); blogpatcherDisplayKeywordUsage();} );

        //default render after page load
        blogpatcherOpenTab(document.getElementById('blogpatcher-tablinks-main'), 'blogpatcher-tab-main');

      // });

    });

    function blogpatcherIsRealtimeLSI(){
      // console.log("RT LSI = " + $('#bp_real_time_lsi').prop('checked'));
      return $('#bp_real_time_lsi').prop('checked');
    }

    function blogpatcherIsRealtimeSEO(){
      // console.log("RT SEO = " + $('#bp_real_time_seo').prop('checked'));
      return $('#bp_real_time_seo').prop('checked');
    }

    function blogpatcherRealtimeLSIChanged(){
      // if(blogpatcherIsRealtimeLSI()){
      //   $('#blogpatcher_refresh_lsi').html("");
      // }
      // else{
      //   var refreshButtonLSI = $('<input/>').attr({ type: 'button', id:'refresh_button_lsi', value:'Refresh'});
      //   refreshButtonLSI.click( function(){ blogpatcherRefreshLSI(); } );
      //
      //   $('#blogpatcher_refresh_lsi').append(refreshButtonLSI);
      // }
    }

    function blogpatcherRefreshLSI(){

    }

    function blogpatcherRealtimeSEOChanged(){
      if(blogpatcherIsRealtimeSEO()){
        $('#blogpatcher_refresh_seo').html("");
        $('#blogpatcher_refresh_lsi').html("");
      }
      else{
        var refreshButtonSEO = $('<input/>').attr({ type: 'button', id:'refresh_button_seo', value:'Refresh'});
        refreshButtonSEO.click( function(){ blogpatcherRefreshSEO(); } );
        $('#blogpatcher_refresh_seo').append(refreshButtonSEO);

        var refreshButtonLSI = $('<input/>').attr({ type: 'button', id:'refresh_button_lsi', value:'Refresh'});
        refreshButtonLSI.click( function(){
          blogpatcherUpdateAddedOnFetch();
          blogpatcherRefreshSEO();
        } );
        $('#blogpatcher_refresh_lsi').append(refreshButtonLSI);
      }
    }

    function blogpatcherRefreshSEO(){
      console.log("refresh SEO");
      blogpatcherDisplaySEO(true);
    }

    function blogpatcherHookTinymce(){

      // var blocks = doc[0].children;
      // wpBlockCount = blocks.length;
      // console.log("> Found "+wpBlockCount + " children");
      //
      // var tmpCnt=0;
      // $.each(blocks, function(i, v){
      //   tmpCnt++;
      //   $(v).unbind('DOMSubtreeModified');
      //   $(v).on('DOMSubtreeModified', function(event) {
      //      console.log("DOM element mod="+event.target+", cur="+event.currentTarget);
      //      if(event.target != lastTarget && lastTarget != null){
      //        blogpatcherBlockExit(lastTarget);
      //        blogpatcherBlockEnter(event.target, event.delegateTarget);
      //        if( $(lastTarget).is("h1") )
      //          blogpatcherH1Changed(lastTarget);
      //        else if( $(lastTarget).is("h2") )
      //          blogpatcherH2Changed(lastTarget);
      //        else if( $(lastTarget).is("img"))
      //          blogpatcherImageChanged();
      //        else
      //          blogpatcherParaChangedTinymce(lastTarget);
      //      }
      //
      //      lastTarget = event.target;
      //
      //    });


        // //test if already bhooked
        // // console.log($(v));
        //   // if(!$(v).attr('bp-data'))
        //   // $(v).attr('bp-data', tmpCnt);
        //   // $(v).attr('tabindex', tmpCnt);
        //   $(v).unbind('click');
        //   // $(v).unbind('focusout');
        //   // $(v).focusin(function(){console.log("focusin");});
        //   // $(v).focusout(function(){console.log("focus out");});
        //
        //
        //   $(v).click(function(event) {
        //     console.log("Click trgt="+event.target+", cls="+ event.target.className +", cur="+event.currentTarget+", cls="+ event.currentTarget.className);
        //     if(event.target != lastTarget && lastTarget != null){
        //       blogpatcherBlockExit(lastTarget);
        //       blogpatcherBlockEnter(event.target, event.delegateTarget);
        //       if( $(lastTarget).is("h1") )
        //         blogpatcherH1Changed(lastTarget);
        //       else if( $(lastTarget).is("h2") )
        //         blogpatcherH2Changed(lastTarget);
        //       else if( $(lastTarget).is("img"))
        //         blogpatcherImageChanged();
        //       else
        //         blogpatcherParaChangedTinymce(lastTarget);
        //     }
        //
        //     lastTarget = event.target;
        //
        //   });

          // wpBlockIds.push($(v).prop('id'));

        // }
      // });

    }

    function blogpatcherHookBlocks(){

      // console.log("Hooking new blocks");
      // doc.find("div.wp-block").addClass('bhooked');
      var blocks = doc.find(isGutenberg ? GUTEN_BLOCK : CLASSIC_BLOCK);
      wpBlockCount = blocks.length;
      // console.log("> Found "+wpBlockCount + " blocks");
      var tmpCnt=0;

      $.each(blocks, function(i, v){
        tmpCnt++;
        //test if already bhooked
        // console.log($(v));
        if($.inArray($(v).prop('id'), wpBlockIds) == -1){

          $(v).focusin(function(event) {
            blogpatcherBlockEnter(event.target, event.delegateTarget);
          });

          if(tmpCnt === 1){
            //special case for first block/paragraph
            // console.log("hooking first wp-block");
            blogpatcherFirstParaChanged(blogpatcherCountKeywords($(v)));
            $(v).focusout(function(event) {
              blogpatcherFirstParaChanged(blogpatcherCountKeywords(event.target));
              blogpatcherBlockExit(event.target);
            });
          }
          else{
            $(v).focusout(function(event) {

              // console.log("OUT trgt="+event.target+", cls="+ event.target.className +", cur="+event.currentTarget+", cls="+ event.currentTarget.className);

              blogpatcherBlockExit(event.target);

              if( $(event.target).is("h1") )
                blogpatcherH1Changed(event.target);
              else if( $(event.target).is("h2") )
                blogpatcherH2Changed(event.target);
              else if( $(event.target).find("img").length > 0 )
                blogpatcherImageChanged();
              else
                blogpatcherParaChanged(event);

            });
          }

          wpBlockIds.push($(v).prop('id'));

        }
      });

    }

    function blogpatcherCountSyllables(word) {

      word = word.toLowerCase();                                     //word.downcase!
      if(word.length <= 3) {
         return 1;
      }                             //return 1 if word.length <= 3
      word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');   //word.sub!(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '')
      word = word.replace(/^y/, '');                                 //word.sub!(/^y/, '')
      //check for null
      var match = word.match(/[aeiouy]{1,2}/g);
      if(match != null)
        return word.match(/[aeiouy]{1,2}/g).length;
      else
        return 0;
                        //word.scan(/[aeiouy]{1,2}/).size
    }

    function blogpatcherCountSentences( paragraph ) {
      // The basic idea is to split the paragraph on `spaces` and thereafter
      // examine each word ending with an EOS punctuation for a possible EOS.

      // Split on **space** to obtain all the `tokens` in the `para`.
      const paraTokens = paragraph.split(/[\s\r\n]+/);
      var sentenceTokens = [];
      var sentences = [];

      for ( let k = 0; k < paraTokens.length; k += 1 ) {
        // A para token.
        const pt = paraTokens[ k ];
        // A lower cased para token.
        const lcpt = pt.toLowerCase();
        if ( ( rgxPotentialEOS.test( pt ) ) && !abbrvNoEOS[ lcpt ] && ( pt.length !== 2 || rgxAlphaAt0.test( pt ) || rgxSplI.test( lcpt ) ) ) {
          // Next para token that is non-blank.
          let nextpt;
          // Append this token to the current sentence tokens.
          sentenceTokens.push( pt );
          // If the current token is one of the abbreviations that may also mean EOS.
          if ( abbrvMayBeEOS[ lcpt ] ) {
            for ( let j = k + 1; j < paraTokens.length && !nextpt; j += 1 ) {
              nextpt = paraTokens[ j ];
            }
          }
          // If no next para token or if present then starts from a Cap Letter then
          // only complete sentence and start a new one!
          if ( nextpt === undefined || ( /^[A-Z]/ ).test( nextpt ) ) {
            sentences.push( sentenceTokens.join( ' ' ) );
            sentenceTokens = [];
          }
        } else sentenceTokens.push( pt );
      }

      if ( sentenceTokens.length > 0 ) sentences.push( sentenceTokens.join( ' ' ) );

      // console.log(sentences);
      return sentences;

    }

    function blogpatcherBlockEnter(el, delEl){

      var tmp;
      if(isGutenberg)
        tmp = $(doc).find("div.wp-block").length;
      else
        tmp = doc[0].children.length;

      if(tmp != wpBlockCount && isGutenberg){
        blogpatcherHookBlocks();
      }

      blogpatcherCountWordsBlock(enterBlock, el);

      // var fs = blogpatcherGetFleschScoreBlock(enterBlock);
      // var overlay = $('<div>', {class: "blogpatcher-overlay" ,text:"FS: "+Math.round(fs)});
      // overlay.appendTo(delEl);

      // enterBlock.links = $(el).find("a").length;
      // if( $(el).find("a").length > 0 )
      //   console.log("block has link!");

      // enterBlock.words = enterBlock.words;
      enterBlock.keywords = blogpatcherCountKeywords(el);
      // console.log("words enter:"+enterBlock.words);

      // console.log(enterBlock);

    }

    function blogpatcherBlockExit(el){

      blogpatcherCountWordsBlock(exitBlock, el);

      var wordCountDiff = exitBlock.words - enterBlock.words;
      wordCount += wordCountDiff;
      sentenceCount += exitBlock.sentences - enterBlock.sentences;
      syllablesCount += exitBlock.syllables - enterBlock.syllables;

      exitBlock.keywords = blogpatcherCountKeywords(el);
      var keywordDiff = exitBlock.keywords - enterBlock.keywords;
      exactMatch += keywordDiff;

      var tmp = $(doc).find("a").length;
      var linksDiff = tmp - linksCount;
      linksCount = tmp;

      tmp = $(doc).find("img").length;
      var imgDiff = tmp - images.length;

      // console.log(exitBlock);

      if(wordCountDiff != 0)
        blogpatcherWordCountChanged();
      if(keywordDiff != 0)
        blogpatcherExactMatchChanged();
      if(linksDiff != 0)
        blogpatcherLinksChanged();
      if(imgDiff != 0)
        blogpatcherImageChanged();

    }

    function blogpatcherLinksChanged(){

      links = $(doc).find("a");
      linksCount = links.length;
      intLinksCount = 0;
      extLinksCount = 0;

      $.each(links, function(i,v){
          if( $(v).attr('href').indexOf(urlDomain) != -1){
            // console.log("internal="+$(v).attr('href'));
            intLinksCount++;
          }
          else{
            // console.log("external="+$(v).attr('href'));
            extLinksCount++;
          }
      });

      if(intLinksCount > 0){
        $("#blogpatcher_links_internal_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
        +"<td>You have " +intLinksCount+ " internal links.</td>");
      }
      else{
        $("#blogpatcher_links_internal_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>Your have no internal links from this page. Add internal links to pass the link juice.</td>");
      }

      if(extLinksCount > 0){
        $("#blogpatcher_links_external_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
        +"<td>You have " +extLinksCount+ " outbound links.</td>");
      }
      else{
        $("#blogpatcher_links_external_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>Your have no outbound links from this page. Add outbound links to authoritative websites.</td>");
      }

    }

    function blogpatcherFirstParaChanged(matches){

      if(blogpatcherIsFocusKeywordEmpty()){
        $("#blogpatcher_text_first_div").html("");
      }
      else if(matches > 0){
        $("#blogpatcher_text_first_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
        +"<td>Your focus keyword has an exact match in the first paragraph.</td>");
      }
      else{
        $("#blogpatcher_text_first_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>Your focus keyword does not have an exact match in your first paragraph.</td>");
      }
    }

    function blogpatcherWordCountChanged(){

      if(wordCount >= 300){
        $("#blogpatcher_text_seo_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
        +"<td>Your text contains " +wordCount+ " words. Which is more than the recommended minimum.</td>");
      }
      else{
        $("#blogpatcher_text_seo_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>Your text only has " +wordCount+ " words. This is considered to be less than the recommended minimum.</td>");
      }
      //competitors
      if(avgPage != null){
        if(wordCount >= avgPage.wordcount){
          $("#blogpatcher_text_length_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
          +"<td>Your competitors has an average word count of "+avgPage.wordcount +" words</td>");
        }
        else if( (wordCount/avgPage.wordcount) >= 0.75){
          $("#blogpatcher_text_length_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
          + "<td>You are using fewer words in your text than your competitors ( Avg. "+avgPage.wordcount +" ) Try to match your competitors word count.</td>");
        }
        else{
          $("#blogpatcher_text_length_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
          + "<td>You are using significantly fewer words in your text than your competitors ( Avg. "+avgPage.wordcount +" ) Try to match your competitors word count.</td>");
        }
      }

      felsch = Math.round(blogpatcherGetFleschScore());
      if(felsch >= 40){
        $("#blogpatcher_text_flesch_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
        +"<td>Your text's Flesch-Kincaid readability score is: " +felsch+ ". This is considered easy enough for a " +blogpatcherGetGrade(felsch)+ " to understand.</td>");
      }
      else{
        $("#blogpatcher_text_flesch_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>Your text's Flesch-Kincaid readability score is: " +felsch+ ". This is considered to be to hard to read for most people.</td>");
      }

      //competitors
      if(avgPage != null){
        var out = "";
        if(Math.abs(felsch-avgPage.flesh) <= 5){
          $("#blogpatcher_text_felsch_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
          +"<td>Your competitors has an average Flesch-Kincaid readability score of "+avgPage.flesh +".</td>");
        }
        else if( Math.abs(felsch-avgPage.flesh) <= 10){
          out = "<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
          + "<td>Your competitors has an average Flesch-Kincaid readability score of "+avgPage.flesh +". ";

          if(felsch<avgPage.flesh){
            out += "Which means your text is harder to read than your competitors.</td>";
          }
          else{
            out += "Which means your text is easier to read than your competitors.</td>";
          }

          $("#blogpatcher_text_felsch_comp_div").html(out);
        }
        else{
          out = "<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
          + "<td>Your competitors has an average Flesch-Kincaid readability score of "+avgPage.flesh +". ";

          if(felsch<avgPage.flesh){
            out += "Which means your text is significantly harder to read than your competitors.</td>";
          }
          else{
            out += "Which means your text is significantly easier to read than your competitors.</td>";
          }

          $("#blogpatcher_text_felsch_comp_div").html(out);
        }
      }

    }

    function blogpatcherGetGrade(score){
      if(score>=90)
        return "5th grader";
      else if(score>=80)
        return "6th grader";
      else if(score>=70)
        return "7th grader";
        else if(score>=65)
          return "8th grader";
          else if(score>=60)
            return "9th grader";
            else if(score>=57)
              return "10th grader";
              else if(score>=54)
                return "11th grader";
                else if(score>=50)
                  return "12th grader";
                  else
                    return "College graduate";
    }

    function blogpatcherExactMatchChanged(){

      //update keyword usage score object
      keywordUsage.exact = exactMatch;

      if(blogpatcherIsFocusKeywordEmpty()){
        $("#blogpatcher_text_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>You have no Focus Keyword set. Manually enter one in the settings tab or fetch a Page Analysis.</td>");
      }
      else{

        if(exactMatch >= 2){
          $("#blogpatcher_text_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
          +"<td>Your text has enough exact matches of your focus keyword. ("+exactMatch+")</td>");
        }
        else{
          $("#blogpatcher_text_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
            + "<td>Your text only has "+exactMatch+" exact matches of your focus keyword. Try to add more exact matches to your text.</td>");
        }

        //competitors
        if(avgPage != null){
          if(exactMatch >= avgPage.bodykw){
            $("#blogpatcher_text_keyword_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
            +"<td>Your competitors has an average "+avgPage.bodykw +" exact matches of the focus keyword.</td>");
          }
          else if( (wordCount/avgPage.bodykw) >= 0.75){
            $("#blogpatcher_text_keyword_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
            + "<td>You have fewer exact matches of the focus keyword than your competitors ( Avg. "+avgPage.bodykw +" ) Try to match your competitors keyword usage.</td>");
          }
          else{
            $("#blogpatcher_text_keyword_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
            + "<td>You have significantly fewer exact matches of the focus keyword than your competitors ( Avg. "+avgPage.bodykw +" ) Try to match your competitors keyword usage.</td>");
          }
        }

      }

    }

    function blogpatcherIsFocusKeywordEmpty(){
      return $('#blogpatcher_page_keyword').val().length > 0 ? false : true;
    }

    //used for all text in whole document
    function blogpatcherCountWords(el){

      var text = el.innerText || el.textContent;
      var words = text.split(/[\s\r\n]+/);
      wordCount = words.length;

      sentenceCount = 0;
      if(isGutenberg){
        $.each(doc.find("div.wp-block"), function(i,v){
          var para = v.innerText || v.textContent;
          sentenceCount += blogpatcherCountSentences(para).length;
        });
      }
      else{
        $.each(doc[0].children, function(i,v){
          var para = v.innerText || v.textContent;
          sentenceCount += blogpatcherCountSentences(para).length;
        });
      }

      // sentenceCount = blogpatcherCountSentences(text).length;
      syllablesCount = 0;
      $.each(words, function (i,v)
      {
        syllablesCount += blogpatcherCountSyllables(v);
      });

    }

    function blogpatcherCountWordsBlock(block, el){

      var text = el.innerText || el.textContent;
      var words = text.split(/[\s\r\n]+/);
      block.sentences = blogpatcherCountSentences(text).length;
      block.words = words.length;
      block.syllables = 0;
      $.each(words, function (i,v)
      {
        block.syllables += blogpatcherCountSyllables(v);
      });

    }

    function blogpatcherCountKeywords(el){

      if(blogpatcherIsFocusKeywordEmpty())
        return 0;

      var text = el.innerText || el.textContent;
      text = text.toLowerCase();
      var pos = text.indexOf($('#blogpatcher_page_keyword').val().toLowerCase());
      var match = 0;
      while(pos != -1){
        match++;
        // console.log("pos="+pos);
        pos = text.indexOf($('#blogpatcher_page_keyword').val().toLowerCase(), pos+1);
      }

      return match;
    }

    function blogpatcherOpenTab(el, tabName) {
      // Declare all variables
      var i, tabcontent, tablinks;

      // Get all elements with class="tabcontent" and hide them
      tabcontent = document.getElementsByClassName("blogpatcher-tabcontent");
      for (i = 0; i < tabcontent.length; i++) {
        tabcontent[i].style.display = "none";
      }

      // Get all elements with class="tablinks" and remove the class "active"
      tablinks = document.getElementsByClassName("blogpatcher-tablinks");
      for (i = 0; i < tablinks.length; i++) {
        tablinks[i].className = tablinks[i].className.replace(" active", "");
      }

      // Show the current tab, and add an "active" class to the link that opened the tab
      document.getElementById(tabName).style.display = "block";
      if(el != null)
        el.className += " active";
    }



    function blogpatcherMarkKeyword(event, text, marked, id){

      if(marked){
        var options = {
          "className": id,
          "separateWordSearch": false,
          "accuracy": {
              "value": "exactly",
              "limiters": [",", ".", "?", "!", "-", "(", ")", "/", "=", "%", ":", ";", "{", "}"]
          }
        };

        if(isGutenberg){
          doc.find("div").mark(text, options);
        }
        else{
          doc.mark(text, options);
          // $('#title').mark(text, options);
        }
        event.target.classList.add('blogpatcher-bold-border');
      }
      else{
        var options = {
          "className": id
        }
        event.target.classList.remove('blogpatcher-bold-border');
        if(isGutenberg){
          doc.find("div").unmark(options);
        }
        else{
          doc.unmark(options);
        }
      }
    }

    function blogpatcherFindNewLSIKeywords(text){
      // find new competitor keywords
      var update = false;
      $.each(avgKw, function (i,v)
      {
        if(v.used == 0){
          if(text.indexOf(v.kw) !== -1){
            v.added = 1;
            v.used = 1;
            update = true;
            // console.log("found new h1 keyword: " + v.kw + " a="+ v.added);
          }
        }
      });

      //if we found new update the keyword labels
      if(update){
        blogpatcherDisplayCompetitorKeywords();
      }

      // find new related keywords
      update = false;
      $.each(related, function (i,v)
      {
        if(v.used == 0){
          if(text.indexOf(v.keyword) !== -1){
            v.added = 1;
            v.used = 1;
            update = true;
            // console.log("found new related: " + v.keyword + " a="+ v.added);
          }
        }
      });

      //if we found new update the keyword labels
      if(update){
        blogpatcherDisplayRelated();
      }

      // find new keyword ideas
      update = false;
      $.each(ideas, function (i,v)
      {
        if(v.used == 0){
          if(text.indexOf(v.keyword) !== -1){
            v.added = 1;
            v.used = 1;
            update = true;
            // console.log("found new related: " + v.keyword + " a="+ v.added);
          }
        }
      });

      //if we found new update the keyword labels
      if(update){
        blogpatcherDisplayIdeas();
      }
    }

    function blogpatcherSlugChanged(el){

      var text = "";
      if(el == null){
        text = loadedSlug;
      }
      else{
        if(isGutenberg)
          text = el.innerText || el.textContent;
        else
          text = $(el).val()
      }
      // console.log("H1 CHANGED="+text);
      text = text.toLowerCase();
      // console.log("Slug changed="+text);

      $('#blogpatcher_slug_seo_div').html("");

      //test for stop words
      var tmp = text.split("-");
      var stop = 0;
      $.each(tmp, function(i,v){
        if($.inArray(v, stopWords) !== -1){
          stop++;
          $('#blogpatcher_slug_seo_div').append("<tr><td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>Your URL slug contains the stop word ["+v+"] - Replace it with another word or remove it.</td></tr>");
        }
      });

      //no stop words found
      if(stop == 0){
        $("#blogpatcher_slug_seo_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
        +"<td>Your URL slug contains no stop words.</td>");
      }

      if(blogpatcherIsFocusKeywordEmpty()){
        $("#blogpatcher_slug_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>You have no Focus Keyword set. Manually enter one in the settings tab or fetch a Page Analysis.</td>");
      }
      else{
        var match = blogpatcherCheckForKeyword($('#blogpatcher_page_keyword').val(), text);
        //update keyword usage score object
        keywordUsage.slug = Math.round(100*match);
        if(match >= MIN_TITLE_MATCH){
          $("#blogpatcher_slug_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
          +"<td>You are using enough of your focus keyword in your URL slug. ("+Math.round(100*match) +"%)</td>");
        }
        else if(match >= WARN_TITLE_MATCH){
          $("#blogpatcher_slug_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
          +"<td>You are only using "+Math.round(100*match) +"% of your focus keyword in your URL slug. If this is the main keyword you want to rank for you should add more of it.</td>");
        }
        else{
          $("#blogpatcher_slug_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>You are not using enough of your focus keyword in your URL slug ("+Math.round(100*match) +"%) Add more of it.</td>");
        }
      }

    }

    function blogpatcherH1Changed(el){

      //no h1?
      if(el == null){
        $('#blogpatcher_h1_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
        + "<td>You do not have any H1 header! The H1 heading is a key SEO element. Be sure to add it and use as much of your focus keyword as possible.</td>");
      }
      else{
        var text = el.innerText || el.textContent;
        // console.log("H1 CHANGED="+text);
        text = text.toLowerCase();
        blogpatcherFindNewLSIKeywords(text);

        //update divs on SEO tab
        if(text.length > MAX_TITLE_LENGTH){
          $('#blogpatcher_h1_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>Your H1 heading is too long - Rewrite your header so it is no more than 70 characters long.</td>");
        }
        else{
          $('#blogpatcher_h1_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
          +"<td>The length of your H1 heading is OK.</td>");
        }

        if(blogpatcherIsFocusKeywordEmpty()){
          $("#blogpatcher_h1_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
            + "<td>You have no Focus Keyword set. Manually enter one in the settings tab or fetch a Page Analysis.</td>");
        }
        else{
          var match = blogpatcherCheckForKeyword($('#blogpatcher_page_keyword').val(), text);
          //update keyword usage score object
          keywordUsage.h1 = Math.round(100*match);
          if(match >= MIN_TITLE_MATCH){
            $("#blogpatcher_h1_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
            +"<td>You are using enough of your focus keyword in your H1 heading. ("+Math.round(100*match) +"%)</td>");
          }
          else if(match >= WARN_TITLE_MATCH){
            $("#blogpatcher_h1_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
            +"<td>You are only using "+Math.round(100*match) +"% of your focus keyword in your H1 heading. If this is the keyword you want to rank for you should add more of it.</td>");
          }
          else{
            $("#blogpatcher_h1_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
            + "<td>You are not using enough of your focus keyword in your H1 heading ("+Math.round(100*match) +"%) Add more of it.</td>");
          }

          //competitors
          if(avgPage != null){
            if(100*match >= avgPage.h1kw){
              $("#blogpatcher_h1_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
              +"<td>Your competitors use on average "+avgPage.h1kw +"% of the focus keyword in their H1 headings.</td>");
            }
            else{
              $("#blogpatcher_h1_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
              + "<td>You are not using the focus keyword in your H1 heading as much as your competitors ( Avg."+avgPage.h1kw +"% ) Try to match your competitors keyword useage.</td>");
            }
          }

        }
      }

    }

    function blogpatcherH2Changed(){

      // console.log("H2 CHANGED=");

      //reset tag
      $('#blogpatcher_h2_seo_div').html("");
      h2s = doc.find("h2");

      if(h2s.length <= 0){
        $('#blogpatcher_h2_seo_div').append("<tr><td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
        + "<td>You do not have any H2 header at all! The H2 heading is a key SEO element. Be sure to add at least one and use as much of your focus keyword as possible.</td></tr>");
      }
      else{
        var allLengthsOk = true;
        var allMatchOk = false;
        var maxMatch = 0;
        $.each(h2s, function (i,v)
        {
          var text = v.innerText || v.textContent;
          text = text.toLowerCase();
          //test each heading for keyword matches
          blogpatcherFindNewLSIKeywords(text);
          //test each heading for max length
          if(text.length > MAX_TITLE_LENGTH){
            $('#blogpatcher_h2_seo_div').append("<tr><td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
            + "<td>Your H2 heading ["+v.innerText+"] is too long - Rewrite the heading so it is no more than 70 characters long.</td></tr>");
            allLengthsOk = false;
          }
          //test each heading for focus keyword
          var match = blogpatcherCheckForKeyword($('#blogpatcher_page_keyword').val(), text);
          if( match >= MIN_H2_MATCH ){
            if(match > maxMatch)
              maxMatch = match;
            allMatchOk = true;
          }

        });

        //update keyword usage score object
        keywordUsage.h2 = Math.round(100*maxMatch);

        //update divs on SEO tab
        if(allLengthsOk){
          $('#blogpatcher_h2_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
          +"<td>The length of all your H2 headings are OK.</td>");
        }

        if(blogpatcherIsFocusKeywordEmpty()){
          $("#blogpatcher_h2_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
            + "<td>You have no Focus Keyword set. Manually enter one in the settings tab or fetch a Page Analysis.</td>");
        }
        else{
          if(allMatchOk){
            $("#blogpatcher_h2_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
            +"<td>You are using enough of your focus keyword in your H2 headings.</td>");
          }
          else{
            $("#blogpatcher_h2_keyword_div").html(
              "<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
              + "<td>You are not using enough of your focus keyword in any of your H2 headings (" +Math.round(100*maxMatch)+ "%). Add more of it in at least one H2 heading.</td>"
            );
          }

          //competitors
          if(avgPage != null){
            if(100*maxMatch >= avgPage.h2kw){
              $("#blogpatcher_h2_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
              +"<td>Your competitors use on average "+avgPage.h2kw +"% of the focus keyword in their H2 headings.</td>");
            }
            else{
              $("#blogpatcher_h2_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
              + "<td>You are not using the focus keyword in your H2 headings as much as your competitors ( Avg."+avgPage.h2kw +"% ) Try to match your competitors keyword useage.</td>");
            }
          }

        }
      }
    }

    function blogpatcherTitleChanged(el){

      title = isGutenberg ? el.innerText || el.textContent : $(el).val();
      title = title.toLowerCase();

      blogpatcherFindNewLSIKeywords(title);

      // console.log("Title CHANGED="+title);

      //update divs on SEO tab
      if(title.length > MAX_TITLE_LENGTH){
        $('#blogpatcher_title_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
        + "<td>Your title is too long - Rewrite your title so it is no more than 70 characters long.</td>");
      }
      else{
        $('#blogpatcher_title_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
        +"<td>The length of your title is OK.</td>");
      }

      if(blogpatcherIsFocusKeywordEmpty()){
        $("#blogpatcher_title_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>You have no Focus Keyword set. Manually enter one in the settings tab or fetch a Page Analysis.</td>");
      }
      else{
        var match = blogpatcherCheckForKeyword($('#blogpatcher_page_keyword').val(), title);
        //update keyword usage score object
        keywordUsage.title = Math.round(100*match);
        if(match >= MIN_TITLE_MATCH){
          $("#blogpatcher_title_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
          +"<td>You are using enough of your focus keyword in your title. ("+Math.round(100*match) +"%)</td>");
        }
        else if(match >= WARN_TITLE_MATCH){
          $("#blogpatcher_title_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
          +"<td>You are only using "+Math.round(100*match) +"% of your focus keyword in your title. If this is your main keyword you should add more of it.</td>");
        }
        else{
          $("#blogpatcher_title_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
          + "<td>You are not using enough of your focus keyword in your title ("+Math.round(100*match) +"%) Add more of it</td>");
        }

        //competitors
        if(avgPage != null){
          if(100*match >= avgPage.titlekw){
            $("#blogpatcher_title_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
            +"<td>Your competitors use on average "+avgPage.titlekw +"% of the focus keyword in their titles.</td>");
          }
          else{
            $("#blogpatcher_title_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
            + "<td>You are not using the focus keyword in your title as much as your competitors ( Avg."+avgPage.titlekw +"% ) Try to match your competitors keyword useage.</td>");
          }
        }

      }

    }

    function blogpatcherMetaChanged(el){

      if(el != null){
        var meta = isGutenberg ? el.innerText || el.textContent : $(el).val();
        meta = meta.toLowerCase();

        // console.log("META="+meta);

        $('#blogpatcher_meta_keyword_div').html("");
        $('#blogpatcher_meta_keyword_comp_div').html("");

        if(meta.length <= 0){
          $('#blogpatcher_meta_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
          + "<td>You have not entered any Meta description.</td>");
        }
        else{
          if(meta.length > MAX_META_LENGTH){
            $('#blogpatcher_meta_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
            + "<td>Your Meta description is too long - Rewrite your Meta description so it is no more than 160 characters long.</td>");
          }
          else{
            $('#blogpatcher_meta_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
            +"<td>The length of your Meta description is OK.</td>");
          }

          if(blogpatcherIsFocusKeywordEmpty()){
            $("#blogpatcher_meta_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
              + "<td>You have no Focus Keyword set. Manually enter one in the settings tab or fetch a Page Analysis.</td>");
          }
          else{
            var match = blogpatcherCheckForKeyword($('#blogpatcher_page_keyword').val(), meta);
            //update keyword usage score object
            keywordUsage.meta = Math.round(100*match);
            if(match >= MIN_TITLE_MATCH){
              $("#blogpatcher_meta_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
              +"<td>You are using enough of your focus keyword in your Meta description. ("+Math.round(100*match) +"%)</td>");
            }
            else {
              $("#blogpatcher_meta_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
              +"<td>You are only using "+Math.round(100*match) +"% of your focus keyword in your Meta description. If this is your main keyword you should add more of it.</td>");
            }
          }
        }
      }

      if(avgPage != null){
        $("#blogpatcher_meta_keyword_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
        +"<td>Your competitors use on average "+avgPage.metakw +"% of the focus keyword in their meta descriptions.</td>");
      }

    }

    function blogpatcherImageChanged(){

      // console.log("image changed");

      //reset tag
      $('#blogpatcher_image_count_div').html("");
      $('#blogpatcher_image_seo_div').html("");
      images = doc.find("img");

      if(images.length <= 0){
        $('#blogpatcher_image_keyword_div').html("");
        $('#blogpatcher_image_src_div').html("");
        $('#blogpatcher_image_seo_div').html("");
        $('#blogpatcher_image_count_div').append("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
        + "<td>Your page does not have any images at all! It is recommended that you use several images on a webpage.</td>");
      }
      else{

        //how many images are used?
        //update divs on SEO tab
        if(images.length >= (wordCount/550)){
          $('#blogpatcher_image_count_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
          +"<td>Your page has " +images.length+ " images which is enough for a page with a word count of " +wordCount+ ".</td>");
        }
        else{
          $('#blogpatcher_image_count_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
          +"<td>Your page has " +images.length+ " images which might be too few for a page with a word count of " +wordCount+ ".</td>");
        }

        //competitors
        if(avgPage != null){
          if( (images.length/avgPage.images) >= 0.9){
            $("#blogpatcher_image_count_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
            +"<td>Your competitors use on average " +avgPage.images +" images on their pages.</td>");
          }
          else if( (images.length/avgPage.images) >= 0.5){
            $("#blogpatcher_image_count_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
            + "<td>Your competitors use on average " +avgPage.images +" images on their pages which is more than you do.</td>");
          }
          else{
            $("#blogpatcher_image_count_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
            + "<td>Your competitors use on average " +avgPage.images +" images on their pages which is significantly more than you do.</td>");
          }
        }

        var allLengthsOk = true;
        var noLengthsOk = true;
        var allMatchOk = false;
        var maxMatch = 0;
        var allMatchOkSrc = false;
        var maxMatchSrc = 0;
        $.each(images, function (i,v)
        {
          var text = $(v).attr('alt');
          var srcSlug = $(v).attr('src').substr($(v).attr('src').lastIndexOf('/') + 1);
          text = text.toLowerCase();
          //test each heading for keyword matches
          blogpatcherFindNewLSIKeywords(text);
          //test if alt is not present
          if(text.length <= 0 || text.indexOf("this image has an empty alt attribute") != -1 || text.indexOf("my alt desc") != -1){
            $('#blogpatcher_image_seo_div').append("<tr><td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
            + "<td>Your image ["+srcSlug+"] does not have any \"alt\" description - Add an alt description and include as much of your focus keyword as possible.</td></tr>");
            allLengthsOk = false;
          }
          else{
            noLengthsOk = false;
            //test each non empty alt for focus keyword
            var match = blogpatcherCheckForKeyword($('#blogpatcher_page_keyword').val(), text);
            if( match >= MIN_H2_MATCH ){
              if(maxMatch < match)
                maxMatch = match;
              allMatchOk = true;
            }
          }
          //test src string
          var matchSrc = blogpatcherCheckForKeyword($('#blogpatcher_page_keyword').val(), srcSlug.toLowerCase());
          if( matchSrc >= MIN_H2_MATCH ){
            if(maxMatchSrc < matchSrc)
              maxMatchSrc = matchSrc;
            allMatchOkSrc = true;
          }

        });

        //update keyword usage score object
        keywordUsage.alt = Math.round(100*maxMatch);
        keywordUsage.src = Math.round(100*maxMatchSrc);

        //update divs on SEO tab
        if(allLengthsOk){
          $('#blogpatcher_image_seo_div').html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
          +"<td>All your images have alt descriptions.</td>");
        }

        if(blogpatcherIsFocusKeywordEmpty()){
          $("#blogpatcher_image_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
            + "<td>You have no Focus Keyword set. Manually enter one in the settings tab or fetch a Page Analysis.</td>");
        }
        else{
          if(noLengthsOk){
            $("#blogpatcher_image_keyword_div").html("");
          }
          if(allMatchOk){
            $("#blogpatcher_image_keyword_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
            +"<td>You are using enough of your focus keyword in your image alt descriptions.</td>");
          }
          else{
            $("#blogpatcher_image_keyword_div").html(
              "<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='#f07d00' opacity='.5' d='M12 4c-4.42 0-8 3.58-8 8s3.58 8 8 8 8-3.58 8-8-3.58-8-8-8zm1 13h-2v-2h2v2zm0-4h-2V7h2v6z'/><path d='M11.99 2C6.47 2 2 6.48 2 12s4.47 10 9.99 10C17.52 22 22 17.52 22 12S17.52 2 11.99 2zM12 20c-4.42 0-8-3.58-8-8s3.58-8 8-8 8 3.58 8 8-3.58 8-8 8zm-1-5h2v2h-2zm0-8h2v6h-2z'/></svg></div></td>"
              + "<td>You are not using enough of your focus keyword in any of your image alt descriptions. Add more of it in at least one image alt description</td>"
            );
          }

          //competitors
          if(avgPage != null){
            if( 100*maxMatch >= avgPage.imgalt ){
              $("#blogpatcher_image_keyword_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
              +"<td>Your competitors use on average "+ avgPage.imgalt +"% of the focus keyword in their image alt descriptions.</td>");
            }
            else{
              $("#blogpatcher_image_keyword_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
              + "<td>Your competitors use on average " + avgPage.imgalt +"% of the focus keyword in their image alt descriptions which is more than you do. Try to match your competitors keyword usage.</td>");
            }
          }

        }

        if(blogpatcherIsFocusKeywordEmpty()){
          $("#blogpatcher_image_src_div").html("");
        }
        else{
          if(allMatchOkSrc){
            $("#blogpatcher_image_src_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#0a0' opacity='.5' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm-2 13l-4-4 1.41-1.41L10 14.17l6.59-6.59L18 9l-8 8z'/><path d='M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm4.59-12.42L10 14.17l-2.59-2.58L6 13l4 4 8-8z'/></svg></div></td>"
            +"<td>You are using enough of your focus keyword in your image file name (src attribute).</td>");
          }
          else{
            $("#blogpatcher_image_src_div").html(
              "<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path opacity='.5' fill='#ffc800' d='M4.47 19h15.06L12 5.99 4.47 19zM13 18h-2v-2h2v2zm0-4h-2v-4h2v4z'/><path d='M1 21h22L12 2 1 21zm3.47-2L12 5.99 19.53 19H4.47zM11 16h2v2h-2zm0-6h2v4h-2z'/></svg></div></td>"
              + "<td>You are not using enough of your focus keyword in any of your image file names. Add more of it in at least one image file name (src attribute)</td>"
            );
          }

          //competitors
          if(avgPage != null){
            if( 100*maxMatchSrc >= avgPage.imgsrc ){
              $("#blogpatcher_image_src_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0V0z'/><path fill='#d4ebf2' opacity='1.0' d='M12 4c-4.41 0-8 3.59-8 8s3.59 8 8 8 8-3.59 8-8-3.59-8-8-8zm1 13h-2v-6h2v6zm0-8h-2V7h2v2z'/><path d='M11 7h2v2h-2zm0 4h2v6h-2zm1-9C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8z'/></svg></div></td>"
              +"<td>Your competitors use on average "+ avgPage.imgsrc +"% of the focus keyword in their image alt descriptions.</td>");
            }
            else{
              $("#blogpatcher_image_src_comp_div").html("<td><div class='icon baseline'><svg xmlns='http://www.w3.org/2000/svg' width='24' height='24' viewBox='0 0 24 24'><path fill='none' d='M0 0h24v24H0z'/><path fill='#ffc800' opacity='.5' d='M12 4.02C7.6 4.02 4.02 7.6 4.02 12S7.6 19.98 12 19.98s7.98-3.58 7.98-7.98S16.4 4.02 12 4.02zM11.39 19v-5.5H8.25l4.5-8.5v5.5h3L11.39 19z'/><path d='M12 2.02c-5.51 0-9.98 4.47-9.98 9.98s4.47 9.98 9.98 9.98 9.98-4.47 9.98-9.98S17.51 2.02 12 2.02zm0 17.96c-4.4 0-7.98-3.58-7.98-7.98S7.6 4.02 12 4.02 19.98 7.6 19.98 12 16.4 19.98 12 19.98zM12.75 5l-4.5 8.5h3.14V19l4.36-8.5h-3V5z'/></svg></div></td>"
              + "<td>Your competitors use on average " + avgPage.imgsrc +"% of the focus keyword in their image alt descriptions which is more than you do. Try to match your competitors keyword usage.</td>");
            }
          }

        }
      }
    }

    function blogpatcherParaChanged(event){

      var text = event.target.innerText || event.target.textContent;
      text = text.toLowerCase();

      //test if first paragraph
      if($(event.currentTarget).is("div:first-child")){

        // console.log("FIRST Block, kw?:"+exitBlock.keywords);
        if(exitBlock.keywords != keywordInFirstParagraph){
          keywordInFirstParagraph = exitBlock.keywords;
          blogpatcherFirstParaChanged(keywordInFirstParagraph);
        }
      }

      // console.log("PARA CHANGED="+text);
      // console.log("TITLE NOW="+getTitleReact());
      blogpatcherFindNewLSIKeywords(text);

    }

    function blogpatcherParaChangedTinymce(el){

      var text = el.innerText || el.textContent;
      text = text.toLowerCase();

      //test if first paragraph
      if($(el).is(doc[0].firstElementChild)){

        // console.log("FIRST Block, kw?:"+exitBlock.keywords);
        if(exitBlock.keywords != keywordInFirstParagraph){
          keywordInFirstParagraph = exitBlock.keywords;
          blogpatcherFirstParaChanged(keywordInFirstParagraph);
        }
      }

      // console.log("PARA CHANGED="+text);
      // console.log("TITLE NOW="+getTitleReact());
      blogpatcherFindNewLSIKeywords(text);

    }

    function blogpatcherGetFleschScore(){
      // console.log("FK: words="+wordCount+", sent="+sentenceCount+", syll="+syllablesCount);
      return 206.835 - 1.015*(wordCount / sentenceCount) - 84.6*(syllablesCount / wordCount);
    }

    function blogpatcherGetFleschScoreBlock(b){
      // console.log("FKB: words="+b.words+", sent="+b.sentences+", syll="+b.syllables);
      return 206.835 - 1.015*(b.words / b.sentences) - 84.6*(b.syllables / b.words);
    }

    function blogpatcherUpdateAddedOnFetch(){

      var blocks = isGutenberg ? doc.find("div.wp-block") : doc[0].children;

      $.each(blocks, function(index, p){

        var text = p.innerText || p.textContent;
        text = text.toLowerCase();

        // find new competitor keywords
        var update = false;
        $.each(avgKw, function (i,v)
        {
          if(v.used == 0){
            if(text.indexOf(v.kw) !== -1){
              v.added = 1;
              v.used = 1;
              update = true;
              // console.log("found new keyword: " + v.kw + " a="+ v.added);
            }
          }
        });

        //if we found new update the keyword labels
        if(update){
          blogpatcherDisplayCompetitorKeywords();
        }

        // find new related keywords
        update = false;
        $.each(related, function (i,v)
        {
          if(v.used == 0){
            if(text.indexOf(v.keyword) !== -1){
              v.added = 1;
              v.used = 1;
              update = true;
              // console.log("found new related: " + v.keyword + " a="+ v.added);
            }
          }
        });

        //if we found new update the keyword labels
        if(update){
          blogpatcherDisplayRelated();
        }

        // find new keyword ideas
        update = false;
        $.each(ideas, function (i,v)
        {
          if(v.used == 0){
            if(text.indexOf(v.keyword) !== -1){
              v.added = 1;
              v.used = 1;
              update = true;
              // console.log("found new related: " + v.keyword + " a="+ v.added);
            }
          }
        });

        //if we found new update the keyword labels
        if(update){
          blogpatcherDisplayIdeas();
        }

      });

    }

    function blogpatcherGetPageData(){

      var sitespan = document.getElementById("siteclose");
      var signmodal = document.getElementById('siteModal');
      sitespan.onclick = function() {
        signmodal.style.display = "none";
      }

      signmodal.style.display = "block";

      //save email as option
      var data = {
    		'action': 'blogpatcher_save_email',
    		'email': $('#blogpatcher_login_email').val()
	     };
    	// We can also pass the url value separately from ajaxurl for front end AJAX implementations
    	jQuery.post(blogpatcher_meta_box_obj.url, data, function(response) {
    		// console.log(response);
    	});

      // Get the data from Blogpatcher.com
      const Url = 'https://blogpatcher.com/wordpresspage.php';
      $.post(Url, {
        email: $('#blogpatcher_login_email').val(),
        pass: $('#blogpatcher_login_pass').val(),
        page: $('#blogpatcher_page').val()
      }).done(function(data, status){

        signmodal.style.display = "none";
        // console.log("raw=" + data);

        if(data.indexOf("No analysis available!") !== -1){
          document.getElementById("blogpatcher_common_div").innerHTML = "No Page Analysis available.";
          document.getElementById("blogpatcher_related_div").innerHTML = "No Page Analysis available.";
          document.getElementById("blogpatcher_lsi_div").innerHTML = "No Page Analysis available.";
          document.getElementById("blogpatcher_status_div").innerHTML = "* No Page Analysis exists for this page.<br><a target='_blank' href='https://blogpatcher.com/analyse?page="
            + $("#blogpatcher_page").val()
            + "'>Let Blogpatcher analyse this page</a>";
          $('#blogpatcher_status_div').attr('style',  'padding:0.3rem');
        }
        else if(data.indexOf("Not logged in!") !== -1){
          document.getElementById("blogpatcher_common_div").innerHTML = "No data available";
          document.getElementById("blogpatcher_related_div").innerHTML = "No data available";
          document.getElementById("blogpatcher_lsi_div").innerHTML = "No data available";
          document.getElementById("blogpatcher_status_div").innerHTML = "* Incorrect login credentials!<br>Please enter the same email address and password you use on the Blogpatcher site.";
          $('#blogpatcher_status_div').attr('style',  'padding:0.3rem');
        }
        else{

          $('#blogpatcher_fetch_status').html("SUCCESS");
          $('#blogpatcher_fetch_status').fadeIn(300, function(){
            blogpatcherFadeStatus();
          } );



          var input = data.split(";");

          //save to objects
          if(input.length > 0){
            commonKw = JSON.parse(input[0]);
          }

          if(input.length > 1){
            avgKw = JSON.parse(input[1]);
          }

          if(input.length > 2){
            related = JSON.parse(input[2]);
          }

          if(input.length > 3){
            ideas = JSON.parse(input[3]);
          }

          if(input.length > 4){
            var tmp = JSON.parse(input[4]);
            if(tmp.length > 0)
              page = tmp[0];
          }

          if(input.length > 5){
            var tmp = JSON.parse(input[5]);
            if(tmp.length > 0)
              avgPage = tmp[0];
          }

          if(input.length > 6){
            serp = JSON.parse(input[6]);
            // if(tmp.length > 0)
            //   serp = tmp[0];
          }
          // console.log(serp);


          document.getElementById("blogpatcher_status_div").innerHTML = "";
          // display copetitor keywords in div
          $('#blogpatcher_status_div').attr('style',  'padding:0rem');
          $('#blogpatcher_page_keyword').val(page.keyword);
          blogpatcherDisplayCompetitorKeywords();
          blogpatcherDisplayRelated();
          blogpatcherDisplayIdeas();
          blogpatcherDisplaySERP();
          $('#blogpatcher_keyword_usage_div').html("");
          // blogpatcherDisplayKeywordUsage();
          var start = Date.now();
          blogpatcherUpdateAddedOnFetch();
          blogpatcherDisplaySEO(true);
          console.log("Blogpatcher SEO computed in: "+ (Date.now()-start) + "ms");
        }

      });

    }

    function blogpatcherFadeStatus(){
      $('#blogpatcher_fetch_status').fadeOut(2000);
    }


    function blogpatcherDisplaySEO(forceUpdate){

      if(!forceUpdate && !blogpatcherIsRealtimeSEO())
        return;

      var start = Date.now();

      //check keyword in title
      blogpatcherTitleChanged( $( isGutenberg ? '#post-title-0' : '#title' )[0]);

      h1s = doc.find("h1");
      if(h1s.length > 0)
        blogpatcherH1Changed(h1s.get(0));
      else
        blogpatcherH1Changed(null);

      blogpatcherH2Changed();

      blogpatcherImageChanged();

      blogpatcherSlugChanged(null);

      blogpatcherCountWords($( isGutenberg ? "div.editor-block-list__layout" : doc)[0]);
      exactMatch = blogpatcherCountKeywords($( isGutenberg ? "div.editor-block-list__layout" : doc)[0]);
      blogpatcherWordCountChanged();
      blogpatcherExactMatchChanged();

      blogpatcherLinksChanged();

      if(isGutenberg)
        blogpatcherFirstParaChanged( blogpatcherCountKeywords( $( doc ).find( 'div.wp-block:first-child' )[0] ) );
      else
        blogpatcherFirstParaChanged( blogpatcherCountKeywords( $( doc ).find( 'p' )[0] ) );

      blogpatcherMetaChanged(isGutenberg ? null : $("#wtt_description"));

      console.log("seo displayed in: "+ (Date.now()-start) + "ms");

    }

    function blogpatcherCheckForKeyword(keyword, text){

      var tmp = keyword.split(" ");
      var size = tmp.length;
      var match = 0;
      $.each(tmp, function(i,v){
        if(text.indexOf(tmp[i]) != -1)
          match++;
      });
      // console.log("kw="+keyword+", text="+text+", size="+size+", match="+match);
      return match/size;
    }

    // create labels with color depending on used and added
    function blogpatcherDisplayCompetitorKeywords(){

      document.getElementById("blogpatcher_common_div").innerHTML = "";

      $("#blogpatcher_sidebar_common_keywords").html("");

      $.each(commonKw, function (i,v)
      {

        var label = $("<label>");

        if(v.added == 1){
          label.append("<span class='cnt-label-blue'>"+ v.matches +"</span>" + v.kw);
          label.addClass("kw-label-rel-blue");
          if(v.marked == 1){
            label.addClass("blogpatcher-bold-border");
          }
          label.click(function(e){
            v.marked = !v.marked;
            blogpatcherMarkKeyword(e, v.kw, v.marked, "c_" + i);
          });
        }
        else if(v.used == 1){
            label.append("<span class='cnt-label-green'>"+ v.matches +"</span>" + v.kw);
          label.addClass("kw-label-rel-green");
          if(v.marked == 1){
            label.addClass("blogpatcher-bold-border");
          }
          label.click(function(e){
            v.marked = !v.marked;
            blogpatcherMarkKeyword(e, v.kw, v.marked, "c_" + i);
          });
        }
        else {
            label.append("<span class='cnt-label-orange'>"+ v.matches +"</span>" + v.kw);
          label.addClass("kw-label-rel-orange");
        }

        $("#blogpatcher_common_div").append(label);
        if($("#blogpatcher_sidebar_common_keywords")){
          label.clone(true).addClass('blogpatcher-scale-70').appendTo("#blogpatcher_sidebar_common_keywords");
          // console.log("appending to sidebar");
        }


      });

      $.each(avgKw, function (i,v)
      {
        var label = $("<label>");

        if(v.added == 1){
          label.append("<span class='cnt-label-blue'>"+ v.matches +"</span>" + v.kw);
          label.addClass("kw-label-rel-blue");
          if(v.marked == 1){
            label.addClass("blogpatcher-bold-border");
          }
          label.click(function(e){
            v.marked = !v.marked;
            blogpatcherMarkKeyword(e, v.kw, v.marked, "c" + i);
          });
        }
        else if(v.used == 1){
          label.append("<span class='cnt-label-green'>"+ v.matches +"</span>" + v.kw);
          label.addClass("kw-label-rel-green");
          if(v.marked == 1){
            label.addClass("blogpatcher-bold-border");
          }
          label.click(function(e){
            v.marked = !v.marked;
            blogpatcherMarkKeyword(e, v.kw, v.marked, "c" + i);
          });
        }
        else {
          label.append("<span class='cnt-label-orange'>"+ v.matches +"</span>" + v.kw);
          label.addClass("kw-label-rel-orange");
        }

        $("#blogpatcher_common_div").append(label);
        if($("#blogpatcher_sidebar_common_keywords")){
          label.clone(true).addClass('blogpatcher-scale-70').appendTo("#blogpatcher_sidebar_common_keywords");
          // console.log("appending to sidebar");
        }

      });

    }

    // create labels with color depending on used and added
    function blogpatcherDisplayRelated(){

      document.getElementById("blogpatcher_related_div").innerHTML = "";
      $.each(related, function (i,v)
      {

        var label = $("<label>");

        if(v.added == 1){
          label.text(v.keyword);
          label.addClass("kw-label-rel-blue");
          if(v.marked == 1){
            label.addClass("blogpatcher-bold-border");
          }
          label.click(function(e){
            v.marked = !v.marked;
            blogpatcherMarkKeyword(e, v.keyword, v.marked, "c" + i);
          });
        }
        else if(v.used == 1){
          label.text(v.keyword);
          label.addClass("kw-label-rel-green");
          if(v.marked == 1){
            label.addClass("blogpatcher-bold-border");
          }
          label.click(function(e){
            v.marked = !v.marked;
            blogpatcherMarkKeyword(e, v.keyword, v.marked, "c" + i);
          });
        }
        else {
          label.text(v.keyword);
          label.addClass("kw-label-rel-orange");
        }

        $("#blogpatcher_related_div").append(label);
        if($("#blogpatcher_sidebar_related_keywords")){
          label.clone(true).addClass('blogpatcher-scale-70').appendTo("#blogpatcher_sidebar_related_keywords");
          // console.log("appending to sidebar");
        }

      });

    }

    function blogpatcherDisplayKeywordUsage(){



      var data = new google.visualization.DataTable();
      var formatter = new google.visualization.NumberFormat({fractionDigits: 0});
      data.addColumn({type:'string', id:'page', label:'Page'});
      data.addColumn({type:'number', id:'title', label:'Title match'});
      data.addColumn({type:'number', id:'h1', label:'H1 match'});
      data.addColumn({type:'number', id:'h2', label:'H2 match'});
      data.addColumn({type:'number', id:'meta', label:'Meta match'});
      data.addColumn({type:'number', id:'exact', label:'Exact match'});
      data.addColumn({type:'number', id:'alt', label:'Img alt match'});
      data.addColumn({type:'number', id:'src', label:'Img src match'});

      $.each(serp, function(i,v){

        var wc = v.wordcount > 0 ? (5000*v.bodykw / v.wordcount) : 0;

        data.addRow( [
          new URL(v.url).hostname,
          Number(v.titlekw),
          Number(v.h1kw),
          Number(v.h2kw),
          Number(v.metakw),
          Number(wc),
          Number(v.imgalt),
          Number(v.imgsrc)
        ]);

      });


      var type = 0;

      for(var j = 0; j < 6; j++){
        formatter.format(data, j+1);
      }

      var options = {
          hAxis: { viewWindow: { min: 0 } },
          title: '',
          height: 400,
          // width: 1000, //$('#blogpatcher-tab-competitors').width(),
          vAxis: { format:'#.########'},
          legend: { position: 'top', maxLines: 4 },
          bar: {groupWidth: "90%"},
          chartArea: {width: '85%'},
          isStacked: true
        };
      // Instantiate and draw our chart, passing in some options.
      var chart = new google.visualization.BarChart(document.getElementById('chart-div-1'));
      chart.draw(data, options);

    }

    function blogpatcherDrawChart(){

    }

    function blogpatcherDisplaySERP(){

      if(serp.length > 0){

        $('#blogpatcher_serp_div').html("");

        $.each(serp, function (i,v)
        {
          // console.log(v);
          $('#blogpatcher_serp_div').append("<div class='mt1'><b>[" + v.rank + "] " + v.title + "</b><br><a href='"+v.url+"' target='_blank'>" + v.url + "</a><br></div>");
        });
      }

    }

    // create labels with color depending on used and added
    function blogpatcherDisplayIdeas(){

      //empty?
      if(ideas.length == 0){
        document.getElementById("blogpatcher_lsi_div").innerHTML = "No keyword ideas found for this keyword. <a href='https://blogpatcher.com/subscribe' target='_blank'>Upgrade to Premium</a> to get keyword ideas";
      }
      else{
        document.getElementById("blogpatcher_lsi_div").innerHTML = "";
        $.each(ideas, function (i,v)
        {

          var label = $("<label>");

          if(v.added == 1){
            label.text(v.keyword);
            label.addClass("kw-label-rel-blue");
            if(v.marked == 1){
              label.addClass("blogpatcher-bold-border");
            }
            label.click(function(e){
              v.marked = !v.marked;
              blogpatcherMarkKeyword(e, v.keyword, v.marked, "c" + i);
            });
          }
          else if(v.used == 1){
            label.text(v.keyword);
            label.addClass("kw-label-rel-green");
            if(v.marked == 1){
              label.addClass("blogpatcher-bold-border");
            }
            label.click(function(e){
              v.marked = !v.marked;
              blogpatcherMarkKeyword(e, v.keyword, v.marked, "c" + i);
            });
          }
          else {
            label.text(v.keyword);
            label.addClass("kw-label-rel-orange");
          }

          $("#blogpatcher_lsi_div").append(label);
          if($("#blogpatcher_sidebar_lsi_keywords")){
            label.clone(true).addClass('blogpatcher-scale-70').appendTo("#blogpatcher_sidebar_lsi_keywords");
            // console.log("appending to sidebar");
          }


        });

      }

    }

    function blogpatcherUpdateSidebar(){
      $.each($("#blogpatcher_common_div").find("label"), function(i, label){
        $(label).clone(true).addClass('blogpatcher-scale-70').appendTo("#blogpatcher_sidebar_common_keywords");
      });
      $.each($("#blogpatcher_related_div").find("label"), function(i, label){
        $(label).clone(true).addClass('blogpatcher-scale-70').appendTo("#blogpatcher_sidebar_related_keywords");
      });
      $.each($("#blogpatcher_lsi_div").find("label"), function(i, label){
        $(label).clone(true).addClass('blogpatcher-scale-70').appendTo("#blogpatcher_sidebar_lsi_keywords");
      });

    }

    function blogPatcherGetKeywordData() {

          // console.log("keyword click");

          const Url = 'https://blogpatcher.com/wordpresskeyword.php';
          $.post(Url, {
            email: $('#blogpatcher_login_email').val(),
            pass: $('#blogpatcher_login_pass').val(),
            keyword: $('#blogpatcher_keyword').val()
          }).done(function(data, status){
            // console.log(data);
            document.getElementById("blogpatcher_common_div").innerHTML = data;
          });

    }

}(jQuery, window, document));
