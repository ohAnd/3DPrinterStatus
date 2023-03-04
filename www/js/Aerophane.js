/*jslint browser: true, this, for, multivar */
/*global window */

function Aerophane(mainMenuTitle, mainMenuData, mainDeviceReady) {
    "use strict";

    var pageDeviceReady, isDeviceReady = false, classname;
    mainMenuTitle = mainMenuTitle || "Aerophane";

    function isTouch() {
        return ("ontouchstart" in window || "onmsgesturechange" in window);
    }
    this.isTouch = isTouch;

    function touchclick(el, func, bubble) {
        bubble = !!bubble;
        if (isTouch()) {
            el.addEventListener("touchstart", func, bubble);
        } else {
            el.addEventListener("click", func, bubble);
        }
    }
    this.touchclick = touchclick;

    function forEachElement(els, func) {
        var ii, len = els.length;

        for (ii = 0; ii < len; ii += 1) {
            func(els[ii], ii);
        }
    }
    this.forEachElement = forEachElement;

    function manipulateClassNames(addOrRemove, el, class_name) {
        var classString = el.className, classArray;

        classArray = classString.split(" ");

        if (classArray.indexOf(class_name) > -1) {
            if (addOrRemove === "remove") {
                classArray.splice(classArray.indexOf(class_name), 1);
            }
        } else {
            if (addOrRemove === "add") {
                classArray.push(class_name);
            }
        }

        el.className = classArray.join(" ");
    }

    classname = {
        "add": function (el, class_name) {
            manipulateClassNames("add", el, class_name);
        },
        "remove": function (el, class_name) {
            manipulateClassNames("remove", el, class_name);
        }
    };
    this.classname = classname;

    function showDialog(el) {
        document.activeElement.blur();
        document.getElementById("matte").style.display = "block";
        classname.add(document.body, "stop-scrolling");
        el.style.display = "block";
    }
    this.showDialog = showDialog;

    function clearDialogs() {
        document.querySelector("nav#main").removeAttribute("style");
        forEachElement(document.querySelectorAll("div.dialog"), function (el) {
            el.style.display = "none";
        });
        document.getElementById("matte").style.display = "none";
        if (document.getElementById("aeroDialogSelect")) {
            document.body.removeChild(document.getElementById("aeroDialogSelect"));
        }
        manipulateClassNames("remove", document.body, "stop-scrolling");
    }

    function createMatte() {
        var navMatte = document.createElement("div");
        navMatte.id = "matte";
        document.body.appendChild(navMatte);

        touchclick(navMatte, clearDialogs);
    }

    function switchArticles(navItems, src) {
        let navSites = document.querySelectorAll("body > article");

        navSites.forEach(function (item) {
            if (src == item.id) {
                document.getElementById(item.id).style.display = "";
            } else {
                document.getElementById(item.id).style.display = "none";
            }
        });
        // set new title
        navItems.forEach(function (item) {
            if (src == item.id) {
                document.getElementById("headerTitle").innerText = item.name;
            }
        });
        // remove side menu after select
        clearDialogs();
    }

    function buildNav(navItems) {
        var navButton, navNav, navH2, navP, navA;

        navButton = document.querySelector("body > header button:first-child");
        navButton.innerHTML = "<div></div><div></div><div></div>";

        // set first entry (homepage) as title
        document.getElementById("headerTitle").innerText = navItems[0].name;

        navNav = document.createElement("nav");
        navNav.id = "main";
        navH2 = document.createElement("h2");
        navH2.textContent = mainMenuTitle;
        navNav.appendChild(navH2);

        navItems.forEach(function (item) {
            navP = document.createElement("p");
            navA = document.createElement("a");
            navA.textContent = item.name;
            navA.href = '#';
            navP.appendChild(navA);
            navNav.appendChild(navP);
            touchclick(navP, function () {
                switchArticles(navItems, item.id);
            });
        });

        document.body.appendChild(navNav);

        touchclick(document.querySelector("body > header button:first-child"), function () {
            document.querySelector("body > nav#main").style.width = "240px";
            document.getElementById("matte").style.display = "block";
            manipulateClassNames("add", document.body, "stop-scrolling");
        });
    }

    function dialogSelect(selects) {
        if (!selects) {
            return;
        }
        forEachElement(selects, function (el) {
            var dsButton = document.createElement("button"),
                dsLabel = document.createElement("span"),
                caret = document.createElement("div");

            dsButton.className = "dialog";
            dsLabel.textContent = el.value;
            dsButton.appendChild(dsLabel);
            caret.className = "caret";
            dsButton.appendChild(caret);

            el.parentNode.insertBefore(dsButton, el);
            touchclick(dsButton, function (e) {
                var elDialog, dialogOption;
                e.preventDefault();

                elDialog = document.createElement("div");
                elDialog.className = "dialog";
                elDialog.id = "aeroDialogSelect";

                forEachElement(el.options, function (option, index) {
                    dialogOption = document.createElement("div");
                    dialogOption.textContent = option.text;
                    dialogOption.setAttribute("data-select-index", index);
                    touchclick(dialogOption, function (e) {
                        el.selectedIndex = +this.getAttribute("data-select-index");
                        el.previousSibling.getElementsByTagName("span")[0].textContent = el.value;
                        clearDialogs();
                    });

                    elDialog.appendChild(dialogOption);
                });

                document.body.appendChild(elDialog);
                showDialog(elDialog);
            });
        });
    }
    this.dialogSelect = dialogSelect;

    function fastForm() {
        var inputTypes = ["text", "password", "email", "number", "search", "checkbox", "radio"];
        var inputs = document.querySelectorAll('input, label');

        function fastcheck(elInput) {
            var inputs, inputType;
            if (elInput.tagName.toLowerCase() === 'label') {
                inputs = elInput.getElementsByTagName("input");
                if (inputs && inputs.length) {
                    elInput = inputs[0];
                }
            }
            inputType = elInput.getAttribute("type");

            if (inputType) {
                inputType.toLowerCase();
            }

            if (inputType === 'checkbox') {
                elInput.checked = !elInput.checked;
            }
            if (inputType === 'radio') {
                elInput.checked = true;
            }
            elInput.focus();
        }

        forEachElement(inputs, function (el) {
            var elInputs;
            if (!isTouch()) {
                return;
            }
            if (!el.getAttribute("type") || inputTypes.indexOf(el.getAttribute("type")) > -1) {
                el.addEventListener("touchstart", function (e) {
                    e.preventDefault();
                    e.stopPropagation();
                    fastcheck(this);
                });
            }
        });
    }
    this.fastForm = fastForm;

    function getTabIndex() {
        if (!location.hash) {
            return 1;
        }
        if (!location.hash.slice(0, 4) === "#tab") {
            return 1;
        }
        var tabIndex = parseInt(location.hash.slice(4));
        if (tabIndex) {
            return tabIndex;
        }
        return 1;
    }

    function showTab(tabIndex) {
        var tabArticles = document.querySelectorAll("article.tabs"),
            tabTabs = document.querySelectorAll("nav.tabs a");

        forEachElement(tabArticles, function (el, ii) {
            if (ii === tabIndex - 1) {
                el.className = "tabs active";
                tabTabs[ii].className = "active";
            } else {
                el.className = "tabs";
                tabTabs[ii].className = "";
            }
        });
    }

    function tabInit() {
        var tabArticles = document.querySelectorAll("article.tabs");

        forEachElement(tabArticles, function (el, ii) {
            var tabNav, tabA, tabName;

            if (ii === 0) {
                tabNav = document.createElement("nav");
                tabNav.className = "tabs";
                document.body.insertBefore(tabNav, el);
            }

            tabA = document.createElement("a");
            tabName = el.firstElementChild;
            tabA.textContent = tabName.textContent;
            el.removeChild(tabName);
            tabA.href = "#tab" + (ii + 1);
            document.querySelector("body > nav").appendChild(tabA);
        });

        window.onhashchange = function () {
            showTab(getTabIndex());
        };

        showTab(getTabIndex());
    }

    this.tab = {};
    this.tab.init = tabInit;
    this.tab.show = showTab;

    this.setPageDeviceReady = function (func) {
        pageDeviceReady = func;

        if (isDeviceReady) {
            func();
        }
    };

    function deviceReady() {
        isDeviceReady = true;

        if (mainDeviceReady) {
            mainDeviceReady();
        }
        if (pageDeviceReady) {
            pageDeviceReady();
        }
    }

    function initializeAero() {
        createMatte();
        buildNav(mainMenuData);
        document.addEventListener("deviceready", deviceReady);
    }

    initializeAero();
}
