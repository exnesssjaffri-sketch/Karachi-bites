/**
 * The production homepage is the Stitch-designed page at /.
 * Redirect any legacy SPA home links there instead of rendering an unused
 * component template into the ordering app.
 */
const homePage = {
  init() {
    window.location.replace("/");
  },
};
