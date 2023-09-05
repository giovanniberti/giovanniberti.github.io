/* Popover tooltip for anchors */

const anchorLinksQuery = "a[href]";
const tippyInstances = [];

function truncate(str, n, useWordBoundary ){
    if (str.length <= n) { return [str, false]; }
    const subString = str.slice(0,  n - 1);
    return [(useWordBoundary 
      ? subString.slice(0, subString.lastIndexOf(" ")) 
      : subString), true];
  }

function getTooltipTheme() {
    return document.documentElement.dataset.scheme === "light" ? "light" : "default";
}

function setupTooltips() {
    document.querySelectorAll(anchorLinksQuery).forEach(aElement => {
        let href = aElement.getAttribute("href");
        if (!href.startsWith("#fn:")) {
            return;
        }

        const targetId = decodeURI(aElement.getAttribute("href").substring(1));
        const refNumber = targetId.substring("fn:".length);
        const content = <HTMLParagraphElement> document.getElementById(targetId).querySelector("p").cloneNode(true);
        const footnoteBackref = content.querySelector(`a.footnote-backref[href="#fnref:${refNumber}"]`);
        content.removeChild(footnoteBackref);

        const [newText, truncated] = truncate(content.innerText, 150, true);
        content.innerText = newText;

        if (truncated) {
            content.innerHTML += " [&hellip;]";
        }

        const tooltipContent = content.innerHTML;

        const instance = tippy(aElement, {
            content: tooltipContent,
            allowHTML: true,
            theme: getTooltipTheme(),
            delay: [null, 500]
        });

        tippyInstances.push(instance);
    });
}

setupTooltips();

var observer = new MutationObserver(function(mutations) {
    mutations.forEach(function(mutation) {
      if (mutation.type === "attributes") {
        for (const instance of tippyInstances) {
            instance.setProps({ theme: getTooltipTheme() });
        }
      }
    });
  });
  
  observer.observe(document.documentElement, {
    attributes: true
  });