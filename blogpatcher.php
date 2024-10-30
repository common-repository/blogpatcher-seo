<?php
/**
 * Plugin Name: Blogpatcher SEO plugin
 * Plugin URI:  https://blogpatcher.com/wordpress-seo-plugin/
 * Description: Blogpatcher SEO plugin for WordPress. Bring the power of Blogpatcher into WordPress.
 * Version:     0.2.1
 * Author:      Blogpatcher.com
 * Author URI:  https://blogpatcher.com/
 * License:     GPL2
 * License URI: https://www.gnu.org/licenses/gpl-2.0.html
 * Text Domain: wporg
 * Domain Path: /languages
 */

 $blogpatcher_version = "0.1.3";

 function blogpatcher_add_dashboard_widget()
 {
     wp_add_dashboard_widget("blogpatcher_widget", "Blogpatcher", "blogpatcher_display_dashboard_widget");
 }

 function blogpatcher_display_dashboard_widget()
 {
 	echo "Visit the Blogpatcher <a href='http://blogpatcher.com/wordpress-seo-plugin/'>WordPress SEO Plugin Page</a><br>";
  // echo "Installed version: " . $blogpatcher_version;
 }
 add_action("wp_dashboard_setup", "blogpatcher_add_dashboard_widget");


 /*
 Plugin Name: Sidebar plugin
 */
 function blogpatcher_sidebar_plugin_register() {
     wp_register_script(
         'blogpatcher-plugin-sidebar-js',
         plugins_url( '/admin/js/blogpatcher-plugin-sidebar.js', __FILE__ ),
         array( 'wp-plugins', 'wp-edit-post', 'wp-element', "wp-components" )
     );
     wp_register_style(
        'blogpatcher-plugin-sidebar-css',
        plugins_url( '/admin/css/blogpatcher-plugin-sidebar.css', __FILE__ )
    );
 }
 add_action( 'init', 'blogpatcher_sidebar_plugin_register' );

 function blogpatcher_sidebar_plugin_script_enqueue() {
     wp_enqueue_script( 'blogpatcher-plugin-sidebar-js' );
 }
 add_action( 'enqueue_block_editor_assets', 'blogpatcher_sidebar_plugin_script_enqueue' );

 function blogpatcher_sidebar_plugin_style_enqueue() {
     wp_enqueue_style( 'blogpatcher-plugin-sidebar-css' );
 }
 add_action( 'enqueue_block_assets', 'blogpatcher_sidebar_plugin_style_enqueue' );

// //get get headers
// function start_wp_head_buffer() {
//     ob_start();
// }
// add_action('wp_head','start_wp_head_buffer',0);
//
// function end_wp_head_buffer() {
//     $in = ob_get_clean();
//
//     // here do whatever you want with the header code
//     echo $in; // output the result unless you want to remove it
//     echo "<script>var headers='".$in."';</script>";
// }
// add_action('wp_head','end_wp_head_buffer', PHP_INT_MAX);

 // function blogpatcher_create_new_metboax_context( $post ) {
 //
 //     do_meta_boxes( null, 'blogpatcher-custom-metabox-holder', $post );
 // }
 // add_action( 'edit_form_after_title', 'blogpatcher_create_new_metboax_context' );

 /* Meta box setup function. */
 function blogpatcher_meta_boxes_setup() {
   /* Add meta boxes on the 'add_meta_boxes' hook. */
   add_action( 'add_meta_boxes', 'blogpatcher_add_custom_box' );
 }

 function blogpatcher_add_custom_box()
 {

   $screens = get_post_types();

   foreach ( $screens as $screen ) {
       add_meta_box(
           'blogpatcher_box_id',           // Unique ID
           'Blogpatcher SEO & Content Optimization',  // Box title
           'blogpatcher_custom_box_html',  // Content callback, must be of type callable
           $screen,
           'advanced',
           'high'
       );
   }

         // add_meta_box(
         //     'blogpatcher_box_id',           // Unique ID
         //     'Blogpatcher',  // Box title
         //     'blogpatcher_custom_box_html',  // Content callback, must be of type callable
         //     'post',                   // Post type
         //     'blogpatcher-custom-metabox-holder'
         // );

 }
 add_action( 'add_meta_boxes', 'blogpatcher_add_custom_box' );

// function blogpatcher_load_me_on_header(){
//
// }
//
//  add_action('wp_head','blogpatcher_load_me_on_header');

/**
 * Check if Block Editor is active.
 * Must only be used after plugins_loaded action is fired.
 *
 * @return bool
 */
function blogpatcher_is_active() {
    // Gutenberg plugin is installed and activated.
    $gutenberg = ! ( false === has_filter( 'replace_editor', 'gutenberg_init' ) );

    // Block editor since 5.0.
    $block_editor = version_compare( $GLOBALS['wp_version'], '5.0-beta', '>' );

    if ( ! $gutenberg && ! $block_editor ) {
        return false;
    }

    if ( blogpatcher_is_classic_editor_plugin_active() ) {
        $editor_option       = get_option( 'classic-editor-replace' );
        $block_editor_active = array( 'no-replace', 'block' );

        return in_array( $editor_option, $block_editor_active, true );
    }

    return true;
}

/**
 * Check if Classic Editor plugin is active.
 *
 * @return bool
 */
function blogpatcher_is_classic_editor_plugin_active() {
    if ( ! function_exists( 'is_plugin_active' ) ) {
        include_once ABSPATH . 'wp-admin/includes/plugin.php';
    }

    if ( is_plugin_active( 'classic-editor/classic-editor.php' ) ) {
        return true;
    }

    return false;
}

 // add_action( 'load-post.php', 'blogpatcher_meta_boxes_setup' );
 // add_action( 'load-post-new.php', 'blogpatcher_meta_boxes_setup' );
// function blogpatcher_after_plugins(){
//   if(blogpatcher_is_active()){
//     echo "<script>var isGutenberg = true;</script>";
//   }
//   else{
//     echo "<script>var isGutenberg = false;</script>";
//   }
// }
// add_action('plugins_loaded', 'blogpatcher_after_plugins');

 function blogpatcher_custom_box_html($post)
 { ?>

   <?php
     wp_nonce_field( basename( __FILE__ ), 'blogpatcher_post_class_nonce' );
     $value = get_post_meta($post->ID, '_wporg_meta_key', true);
     echo "<script>var loadedSlug='".$post->post_name."';</script>";
     $url_endpoint = get_permalink();
     $url_endpoint = parse_url( $url_endpoint );
     $url_endpoint = $url_endpoint['host'];
     echo "<script>var urlDomain='".$url_endpoint."';</script>";
   ?>

   <div class="blogpatcher-flex-tabs">
   <div class="blogpatcher-tab">
    <span class="blogpatcher-tablinks" id="blogpatcher-tablinks-main"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path opacity=".3" d="M19.28 8.6l-.7-1.21-1.27.51-1.06.43-.91-.7c-.39-.3-.8-.54-1.23-.71l-1.06-.43-.16-1.13L12.7 4h-1.4l-.19 1.35-.16 1.13-1.06.44c-.41.17-.82.41-1.25.73l-.9.68-1.05-.42-1.27-.52-.7 1.21 1.08.84.89.7-.14 1.13c-.03.3-.05.53-.05.73s.02.43.05.73l.14 1.13-.89.7-1.08.84.7 1.21 1.27-.51 1.06-.43.91.7c.39.3.8.54 1.23.71l1.06.43.16 1.13.19 1.36h1.39l.19-1.35.16-1.13 1.06-.43c.41-.17.82-.41 1.25-.73l.9-.68 1.04.42 1.27.51.7-1.21-1.08-.84-.89-.7.14-1.13c.04-.31.05-.52.05-.73 0-.21-.02-.43-.05-.73l-.14-1.13.89-.7 1.1-.84zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4z"/><path d="M19.43 12.98c.04-.32.07-.64.07-.98 0-.34-.03-.66-.07-.98l2.11-1.65c.19-.15.24-.42.12-.64l-2-3.46c-.09-.16-.26-.25-.44-.25-.06 0-.12.01-.17.03l-2.49 1c-.52-.4-1.08-.73-1.69-.98l-.38-2.65C14.46 2.18 14.25 2 14 2h-4c-.25 0-.46.18-.49.42l-.38 2.65c-.61.25-1.17.59-1.69.98l-2.49-1c-.06-.02-.12-.03-.18-.03-.17 0-.34.09-.43.25l-2 3.46c-.13.22-.07.49.12.64l2.11 1.65c-.04.32-.07.65-.07.98s.03.66.07.98l-2.11 1.65c-.19.15-.24.42-.12.64l2 3.46c.09.16.26.25.44.25.06 0 .12-.01.17-.03l2.49-1c.52.4 1.08.73 1.69.98l.38 2.65c.03.24.24.42.49.42h4c.25 0 .46-.18.49-.42l.38-2.65c.61-.25 1.17-.59 1.69-.98l2.49 1c.06.02.12.03.18.03.17 0 .34-.09.43-.25l2-3.46c.12-.22.07-.49-.12-.64l-2.11-1.65zm-1.98-1.71c.04.31.05.52.05.73 0 .21-.02.43-.05.73l-.14 1.13.89.7 1.08.84-.7 1.21-1.27-.51-1.04-.42-.9.68c-.43.32-.84.56-1.25.73l-1.06.43-.16 1.13-.2 1.35h-1.4l-.19-1.35-.16-1.13-1.06-.43c-.43-.18-.83-.41-1.23-.71l-.91-.7-1.06.43-1.27.51-.7-1.21 1.08-.84.89-.7-.14-1.13c-.03-.31-.05-.54-.05-.74s.02-.43.05-.73l.14-1.13-.89-.7-1.08-.84.7-1.21 1.27.51 1.04.42.9-.68c.43-.32.84-.56 1.25-.73l1.06-.43.16-1.13.2-1.35h1.39l.19 1.35.16 1.13 1.06.43c.43.18.83.41 1.23.71l.91.7 1.06-.43 1.27-.51.7 1.21-1.07.85-.89.7.14 1.13zM12 8c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2z"/></svg></span>
    <span class="blogpatcher-tablinks" id="blogpatcher-tablinks-seo"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path opacity=".3" d="M7 12.27v3.72l5 2.73 5-2.73v-3.72L12 15zM5.18 9L12 12.72 18.82 9 12 5.28z"/><path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm5 12.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72zm-5-3.27L5.18 9 12 5.28 18.82 9 12 12.72z"/></svg></span>
    <span class="blogpatcher-tablinks" id="blogpatcher-tablinks-competitors"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><circle opacity=".3" cx="9" cy="8.5" r="1.5"/><path opacity=".3" d="M4.34 17h9.32c-.84-.58-2.87-1.25-4.66-1.25s-3.82.67-4.66 1.25z"/><path d="M9 12c1.93 0 3.5-1.57 3.5-3.5S10.93 5 9 5 5.5 6.57 5.5 8.5 7.07 12 9 12zm0-5c.83 0 1.5.67 1.5 1.5S9.83 10 9 10s-1.5-.67-1.5-1.5S8.17 7 9 7zm0 6.75c-2.34 0-7 1.17-7 3.5V19h14v-1.75c0-2.33-4.66-3.5-7-3.5zM4.34 17c.84-.58 2.87-1.25 4.66-1.25s3.82.67 4.66 1.25H4.34zm11.7-3.19c1.16.84 1.96 1.96 1.96 3.44V19h4v-1.75c0-2.02-3.5-3.17-5.96-3.44zM15 12c1.93 0 3.5-1.57 3.5-3.5S16.93 5 15 5c-.54 0-1.04.13-1.5.35.63.89 1 1.98 1 3.15s-.37 2.26-1 3.15c.46.22.96.35 1.5.35z"/></svg></span>
    <span class="blogpatcher-tablinks" id="blogpatcher-tablinks-keywords"><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24"><path fill="none" d="M0 0h24v24H0V0z"/><path opacity=".3" d="M11.71 10.33C11.01 8.34 9.11 7 7 7c-2.76 0-5 2.24-5 5s2.24 5 5 5c2.11 0 4.01-1.34 4.71-3.33l.23-.67H18v4h2v-4h2v-2H11.94l-.23-.67zM7 15c-1.65 0-3-1.35-3-3s1.35-3 3-3 3 1.35 3 3-1.35 3-3 3z"/><path d="M7 5c-3.86 0-7 3.14-7 7s3.14 7 7 7c2.72 0 5.17-1.58 6.32-4H16v4h6v-4h2V9H13.32C12.17 6.58 9.72 5 7 5zm15 8h-2v4h-2v-4h-6.06l-.23.67C11.01 15.66 9.11 17 7 17c-2.76 0-5-2.24-5-5s2.24-5 5-5c2.11 0 4.01 1.34 4.71 3.33l.23.67H22v2zM7 9c-1.65 0-3 1.35-3 3s1.35 3 3 3 3-1.35 3-3-1.35-3-3-3zm0 4c-.55 0-1-.45-1-1s.45-1 1-1 1 .45 1 1-.45 1-1 1z"/></svg></span>
  </div>

  <div id="blogpatcher-tab-main" class="blogpatcher-tabcontent">
    <div class="form-login-popup">

      <label><h3 class="clear-both mb1">Blogpatcher Login Credentials</h3></label>
      <label><input type="text" id="blogpatcher_login_email" name="blogpatcher_login_email" placeholder="Your e-mail address" value="<?php echo get_option('blogpatcher_email') ?>"></label>
      <label><input type="password" name="blogpatcher_login_pass" id="blogpatcher_login_pass" maxlength="64"  placeholder="Your password"></label><br>
      <div class="blogpatcher-notice" id="blogpatcher_status_div"></div>
      <span>No account? <a target="_blank" href="https://blogpatcher.com/register"> Sign up now</a></span><br>

    </div>
    <h3 class="clear-both mb1">Load Page Analysis</h3>
    <input class="mr1" type="text" name="blogpatcher_page" id="blogpatcher_page" value="<?php echo get_permalink($post); ?>" size="70">
    <input type="button" name="blogpatcher_keyword_submit" id="blogpatcher_page_submit" value="Fetch Page Analysis"><span class="ml1" id="blogpatcher_fetch_status"></span><br>
    <h3 class="clear-both mb1">Focus Keyword</h3>
    <input type="text" placeholder="Enter keyword OR fetch a Page Analysis" name="blogpatcher_page_keyword" id="blogpatcher_page_keyword" value="" size="36">
    <h3 class="clear-both mb1">Settings</h3>
    <div>
      <input class="mr4" type="checkbox" id="bp_real_time_seo" value="real-time-seo-on">Real-time update</input>
      <!-- <span  class="mr3"> </span>
      <input type="checkbox" id="bp_real_time_lsi" value="real-time-seo-lsi">LSI Tracking</input> -->
    </div>
    <br><br><br>

    <div id="siteModal" class="modal">
      <div class="modal-content">
        <span id="siteclose" class="close">&times;</span>
            <br><br>
            <h3>Please wait . . .</h3>
            <br><br>
      </div>

    </div>
  </div>

  <div id="blogpatcher-tab-keywords" class="blogpatcher-tabcontent">
    <div id="blogpatcher_refresh_lsi"></div>
    <h3 class="clear-both mb1">Competitor Common Keywords</h3>
    <div id="blogpatcher_common_div">Fetch a Page or Keyword Analysis to display data here.</div>

    <h3 class="clear-both mb1">Related Search Phrases</h3>
    <div id="blogpatcher_related_div">Fetch a Page or Keyword Analysis to display data here.</div>

    <h3 class="clear-both mb1">Keyword Ideas</h3>
    <div id="blogpatcher_lsi_div">Fetch a Page or Keyword Analysis to display data here.</div>

    <div class="clear-both mb1"></div>
    <br><br><br>
  </div>

  <div id="blogpatcher-tab-seo" class="blogpatcher-tabcontent">
    <div id="blogpatcher_refresh_seo"></div>
    <h3 class="clear-both mb1">Title</h3>
    <div id="blogpatcher_title_seo_div"></div>
    <div id="blogpatcher_title_keyword_div"></div>
    <div id="blogpatcher_title_comp_div"></div>

    <h3 class="clear-both mb1">Headings</h3>
    <div id="blogpatcher_h1_seo_div"></div>
    <div id="blogpatcher_h1_keyword_div"></div>
    <div id="blogpatcher_h1_comp_div"></div>
    <div id="blogpatcher_h2_seo_div"></div>
    <div id="blogpatcher_h2_keyword_div"></div>
    <div id="blogpatcher_h2_comp_div"></div>

    <h3 class="clear-both mb1">Text</h3>
    <div id="blogpatcher_text_seo_div"></div>
    <div id="blogpatcher_text_length_comp_div"></div>
    <div id="blogpatcher_text_keyword_div"></div>
    <div id="blogpatcher_text_keyword_comp_div"></div>
    <div id="blogpatcher_text_first_div"></div>
    <div id="blogpatcher_text_flesch_div"></div>
    <div id="blogpatcher_text_felsch_comp_div"></div>

    <h3 class="clear-both mb1">Images</h3>
    <div id="blogpatcher_image_count_div"></div>
    <div id="blogpatcher_image_count_comp_div"></div>
    <div id="blogpatcher_image_seo_div"></div>
    <div id="blogpatcher_image_seo_comp_div"></div>
    <div id="blogpatcher_image_keyword_div"></div>
    <div id="blogpatcher_image_keyword_comp_div"></div>
    <div id="blogpatcher_image_src_div"></div>
    <div id="blogpatcher_image_src_comp_div"></div>

    <h3 class="clear-both mb1">Slug</h3>
    <div id="blogpatcher_slug_seo_div"></div>
    <div id="blogpatcher_slug_keyword_div"></div>

    <h3 class="clear-both mb1">Links</h3>
    <div id="blogpatcher_links_internal_div"></div>
    <div id="blogpatcher_links_external_div"></div>

    <h3 class="clear-both mb1">Meta</h3>
    <div id="blogpatcher_meta_seo_div">Meta editor coming soon.</div>
    <div id="blogpatcher_meta_keyword_div"></div>
    <div id="blogpatcher_meta_keyword_comp_div"></div>

    <input type="hidden" value="0" id="blogpatcher_sidebar_counter">



    <div class="clear-both mb1"></div>
    <br><br><br>
  </div>

  <div id="blogpatcher-tab-competitors" class="blogpatcher-tabcontent">
    <h3 class="clear-both mb1">SERP</h3>
    <div id="blogpatcher_serp_div">Fetch a Page or Keyword Analysis to display data here.</div>
    <h3 class="clear-both mb0 mt4">Keyword Usage</h3>
    <div class="chart-div" id="chart-div-1"></div>
    <div id="blogpatcher_keyword_usage_div">Fetch a Page or Keyword Analysis to display data here.</div>

    <div class="clear-both mb1"></div>
    <br><br><br>
  </div>

</div>
<div class="clear-both mb1"></div>
   <?php
  }


  function blogpatcher_meta_box_scripts()
{
    // get current admin screen, or null
    // $screen = get_current_screen();
    // // verify admin screen object
    // if (is_object($screen)) {
    //     // enqueue only for specific post types
    //     if (in_array($screen->post_type, ['post', 'wporg_cpt'])) {
            // enqueue script
            wp_enqueue_script('blogpatcher_meta_box_script_mark', plugin_dir_url(__FILE__) . '/admin/js/blogpatcher-jquery.mark.min.js', ['jquery']);
            wp_localize_script(
                'blogpatcher_meta_box_script_mark',
                'blogpatcher_meta_box_mark_obj',
                [
                    'url' => admin_url('admin-ajax.php'),
                ]
            );

            // wp_enqueue_script('blogpatcher_meta_box_script_google', plugin_dir_url(__FILE__) . '/admin/js/blogpatcher-jsapi.js', ['jquery']);
            // wp_localize_script(
            //     'blogpatcher_meta_box_script_google',
            //     'blogpatcher_meta_box_mark_obj',
            //     [
            //         'url' => admin_url('admin-ajax.php'),
            //     ]
            // );

            wp_enqueue_script('blogpatcher_meta_box_script_admin', plugin_dir_url(__FILE__) . '/admin/js/blogpatcher-admin.js', ['jquery', 'wp-data']);
            // localize script, create a custom js object
            wp_localize_script(
                'blogpatcher_meta_box_script_admin',
                'blogpatcher_meta_box_obj',
                [
                    'url' => admin_url('admin-ajax.php'),
                ]
            );

            wp_enqueue_style( 'blogpatcher-plugin-sidebar-css' );
    //     }
    // }
}
// add_action('admin_enqueue_scripts', 'blogpatcher_meta_box_scripts');
add_action('admin_print_scripts-post.php', 'blogpatcher_meta_box_scripts');
add_action('admin_print_scripts-post-new.php', 'blogpatcher_meta_box_scripts');

// add_action('admin_print_styles-post.php', 'call_my_styles_function');
// add_action('admin_print_styles-post-new.php', 'call_my_styles_function');

// Save email handler function...
add_action( 'wp_ajax_blogpatcher_save_email', 'blogpatcher_save_email' );
function blogpatcher_save_email() {
	global $wpdb;
	update_option( 'blogpatcher_email', sanitize_email($_POST['email']), true );
  // echo "email=" . $_POST['email'];
	wp_die();
}

// function blogpatcher_meta_box_ajax_handler()
// {
//     if (isset($_POST['keyword'])) {
//         switch ($_POST['keyword']) {
//             case 'some':
//                 echo 'success';
//                 break;
//             default:
//                 echo 'failure';
//                 break;
//         }
//     }
//     // ajax handlers must die
//     die;
// }
// // wp_ajax_ is the prefix, wporg_ajax_change is the action we've used in client side code
// add_action('wp_ajax_blogpatcher_ajax_click', 'blogpatcher_meta_box_ajax_handler');

 function blogpatcher_setup_post_type() {
     // register the "book" custom post type
     register_post_type( 'book', ['public' => 'true'] );
 }
 add_action( 'init', 'blogpatcher_setup_post_type' );

 function blogpatcher_install() {
     // trigger our function that registers the custom post type
     // blogpatcher_setup_post_type();

     // clear the permalinks after the post type has been registered
     // flush_rewrite_rules();
 }

 function blogpatcher_deactivation() {
    // unregister the post type, so the rules are no longer in memory
    // unregister_post_type( 'book' );
    // clear the permalinks to remove our post type's rules from the database
    // flush_rewrite_rules();
}
register_deactivation_hook( __FILE__, 'blogpatcher_deactivation' );

function blogpatcher_uninstall() {
  // if uninstall.php is not called by WordPress, die
  if (!defined('WP_UNINSTALL_PLUGIN')) {
     die;
  }

  $option_name = 'blogpatcher_email';

  delete_option($option_name);

  // for site options in Multisite
  delete_site_option($option_name);

  // drop a custom database table
  global $wpdb;
  $wpdb->query("DROP TABLE IF EXISTS {$wpdb->prefix}mytable");
}
register_uninstall_hook(__FILE__, 'blogpatcher_uninstall');
