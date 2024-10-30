( function( wp ) {

    var registerPlugin = wp.plugins.registerPlugin;
    var PluginSidebar = wp.editPost.PluginSidebar;
    var el = wp.element.createElement;
    var counter = 0;

    class App extends React.Component {
        constructor(props) {
            super(props);

            // this.state = {
            //     message: "Hello World!",
            //     date: new Date(),
            // }
        }

        componentDidMount() {
          // console.log("mounting")
            // this.timerID = setInterval(
            //     () => {
            //     this.tick()
            //     },
            //     1000
            // );
        }

        componentDidUpdate() {
          counter++;
          // document.getElementById("blogpatcher_sidebar_counter").value = counter;
          document.getElementById("blogpatcher_sidebar_counter").value = $("#blogpatcher_sidebar_div").is(':visible');
          document.getElementById("blogpatcher_sidebar_counter").dispatchEvent(new Event('change'));
          // el.dispatchEvent(new Event('change'));

          // console.log("updating");
          // document.getElementById("blogpatcher_sidebar_updated");
          // blogpatcherDisplayRelated();
        }

        componentWillUnmount() {
            // clearInterval(this.timerID);
        }

        render() {
          var tmpTitle = wp.data.select( 'core/editor' ).getEditedPostAttribute( 'title' );
          console.log("R title="+tmpTitle);
          return el( PluginSidebar,
              {
                  name: 'blogpatcher-plugin-sidebar',
                  icon: 'admin-post',
                  title: 'Blogpatcher plugin sidebar',

              },
              el('div', null,
                el( 'div',
                    {
                      className: 'plugin-sidebar-content',
                      id: 'blogpatcher_sidebar_div',

                    },

                    el( 'h2', { className: 'clear-both mb1'}, "Competitor common keywords" ),
                    el('div',
                      {
                        id: 'blogpatcher_sidebar_common_keywords',
                      }
                    ),

                    el( 'h2', { className: 'clear-both mb1'}, "Related searches" ),
                    el('div',
                      {
                        id: 'blogpatcher_sidebar_related_keywords',
                      }
                    ),

                    el( 'h2', { className: 'clear-both mb1'}, "Keyword ideas" ),
                    el('div',
                      {
                        id: 'blogpatcher_sidebar_lsi_keywords',
                      }
                    ),
                    el('div',
                      {
                        className: 'clear-both mb1',
                      }
                    ),
                  )
                )

          )
        }

        // tick = () => {
        // debugger
        //     this.setState({
        //         date: new Date()
        //     });
        // }
    }

    registerPlugin( 'blogpatcher-plugin-sidebar', {
        render: function() {
          // console.log("render");
          return el(App);
          // return BlogpatcherDisplay;
            // return el( PluginSidebar,
            //     {
            //         name: 'blogpatcher-plugin-sidebar',
            //         icon: 'admin-post',
            //         title: 'Blogpatcher plugin sidebar',
            //
            //     },
            //     el( 'div',
            //         {
            //           className: 'plugin-sidebar-content',
            //           id: 'blogpatcher_sidebar_div',
            //
            //         },
            //
            //         el( 'h2', { className: 'clear-both mb1'}, "Competitor common keywords" ),
            //         el('div',
            //           {
            //             id: 'blogpatcher_sidebar_common_keywords',
            //           }
            //         ),
            //
            //         el( 'h2', { className: 'clear-both mb1'}, "Related searches" ),
            //         el('div',
            //           {
            //             id: 'blogpatcher_sidebar_related_keywords',
            //           }
            //         ),
            //
            //         el( 'h2', { className: 'clear-both mb1'}, "Keyword ideas" ),
            //         el('div',
            //           {
            //             id: 'blogpatcher_sidebar_lsi_keywords',
            //           }
            //         ),
            //         el('div',
            //           {
            //             className: 'clear-both mb1',
            //           }
            //         ),
            //
            //     )
            //
            // )

        }
    }

  );

} )( window.wp );

(function ($, window, document) {
    'use strict';
    var _ = this;
    // execute when the DOM is ready
    $(document).ready(function () {

      // console.log("React dom ready");

      // blogpatcherDisplayCompetitorKeywords();
      //
      //   // js 'change' event triggered on the wporg_field form field
      //   $('#blogpatcher_keyword_submit').click( function (e) {
      //       e.preventDefault();
      //       console.log("keyword click");
      //
      //       const Url = 'https://blogpatcher.com:899/app?word=' + $('#blogpatcher_keyword').val();
      //       $.get(Url, function(data, status){
      //         console.log(data);
      //         document.getElementById("blogpatcher_syn_div").innerHTML = data;
      //       });
      //
      //   });
    });

    function updateOnRender(){
      // console.log("update on render");
    }

}(jQuery, window, document));
