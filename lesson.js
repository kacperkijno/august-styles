/* August Kjerland — lesson page entrance animations
   Adds .ak-in class to elements as they scroll into view.
   Pairs with lesson.css opacity/transform rules.
*/
(function () {
  if (!('IntersectionObserver' in window)) {
    // Fallback: show everything immediately
    document.querySelectorAll('body.ak-lesson [id^="row-"], body.ak-lesson [font-family^="AdobeCaslonPro"][font-size="26"]')
      .forEach(function (el) { el.classList.add('ak-in'); });
    return;
  }

  var io = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('ak-in');
        io.unobserve(entry.target);
      }
    });
  }, {
    threshold: 0.12,
    rootMargin: '0px 0px -60px 0px'
  });

  function init() {
    if (!document.body.classList.contains('ak-lesson')) return;

    var targets = document.querySelectorAll(
      'body.ak-lesson [size="4"] > div > [id^="row-"], ' +
      'body.ak-lesson [font-family^="AdobeCaslonPro"][font-size="26"], ' +
      'body.ak-lesson [id^="row-"][style*="rgb(243, 240, 231)"], ' +
      'body.ak-lesson [id^="row-"][style*="rgb(26, 60, 47)"]'
    );
    targets.forEach(function (el) { io.observe(el); });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-scan after 1s in case systeme.io hydrates async
  setTimeout(init, 1000);
})();
