/*jshint -W064 */

define(function (require, exports, module) {
    "use strict";

    // -- MODULES
    var AppInit = brackets.getModule("utils/AppInit"),
        CodeInspection = brackets.getModule("language/CodeInspection"),
        CodeMirror = brackets.getModule("thirdparty/CodeMirror2/lib/codemirror"),
        Dialogs = brackets.getModule("widgets/Dialogs"),
        DocumentManager = brackets.getModule("document/DocumentManager"),
        ExtensionUtils = brackets.getModule("utils/ExtensionUtils"),
        MainViewManager = brackets.getModule("view/MainViewManager"),
        StringUtils = brackets.getModule("utils/StringUtils"),
        // -- TANSLATIONS
        Strings = require("strings"),
        // -- VARIABLES
        linters = [ "JSLint", "JSHint", "ESLint" ],
        $problemsPanelTable;

    ExtensionUtils.loadStyleSheet(module, "style/main.css");

    function loadExplanation(error) {
        var deferred = $.Deferred();
        $.getJSON("http://api.jslinterrors.com/explain", {
            message: error,
            format: "html"
        }).then(function (result) {
            var response = {
                explanation: result.explanation,
                author: {
                    name: result.author.name,
                    urls: {}
                }
            };
            ["github", "twitter", "gravatar"].forEach(function (site) {
                if (result.author[site]) {
                    response.author.urls[site.replace(/^./, Function.prototype.call.bind("".toUpperCase))] = "https://" + site + ".com/" + result.author[site];
                }
            });
            if (result.author.gplus) {
                response.author.urls["Google+"] = "https://plus.google.com/" + result.author.gplus;
            }
            deferred.resolve(response);
        }, function (error) {
            deferred.reject(error);
        });
        return deferred.promise();
    }

    function openExplanation(error) {
        var deferred = $.Deferred();
        loadExplanation(error).always(function () {
            deferred.resolve();
        }).then(function (result) {
            var dialog = Dialogs.showModalDialog("jslint-errors_explanation", error, result.explanation),
                $author = $("<div class='jslint-errors_author'/>").text("Written by" + result.author.name);
            Object.keys(result.author.urls).forEach(function (site) {
                $("<a/>").attr("href", result.author.urls[site]).text(site).appendTo($author).wrap("<span/>");
            });
            dialog.getElement().find("pre > code.lang-javascript").each(function () {
                var $this = $(this),
                    $pre = $this.parent("pre"),
                    code = $this.html().replace(/\n$/, "");

                CodeMirror(function (highlighted) {
                    $this.replaceWith(highlighted);
                }, {
                    value: code,
                    mode: "javascript",
                    lineNumbers: false,
                    readOnly: true
                });

                $pre.css("background-color", $pre.find(".CodeMirror-scroll").css("background-color"));
            });
            dialog.getElement().find(".modal-body").append("<hr/>").append($author);
        }, function (response) {
            if (response.status === 404) {
                Dialogs.showModalDialog("dialog-error", Strings.NOT_FOUND_TITLE, StringUtils.format(Strings.NOT_FOUND_ERROR, error));
            }
        });
        return deferred.promise();
    }

    function addButton(event) {
        var $table = $("tr", event.currentTarget),
            currentLinter;
        if (!$table.eq(0).data("jslint-errors")) {
            $table.eq(0).data("jslint-errors", true);
            $table.each(function () {
                var $tr = $(this);
                if ($tr.hasClass("inspector-section")) {
                    currentLinter = linters.some(function (linter) {
                        if ($tr.text().indexOf(linter) !== -1) {
                            return true;
                        }
                    });
                } else if(currentLinter) {
                    $("<span class='jslint-errors_button'/>").click(function (event) {
                        var $this = $(this),
                            error = $this.parent(".line-text").text().replace(/\s*(\([WE]\d+\)|\[[a-z-]+\])$/, "");
                        if (!$this.hasClass("loading")) {
                            $this.addClass("loading");
                            openExplanation(error).then(function () {
                                $this.removeClass("loading");
                            });
                        }
                        event.stopPropagation();
                    }).appendTo($tr.find(".line-text"));
                }
            });
        }
        attachListener();
    }

    function attachListener() {
        $problemsPanelTable.off("DOMNodeIndetred");
        var path = MainViewManager.getCurrentlyViewedPath(MainViewManager.ACTIVE_PANE);
        if (path && CodeInspection.getProvidersForPath(path).some(function (provider) {
            return linters.indexOf(provider.name) !== -1;
        })) {
            $problemsPanelTable.one("DOMNodeInserted", addButton);
        }
    }

    AppInit.htmlReady(function () {
        $problemsPanelTable = $("#problems-panel .table-container");

        attachListener();
        MainViewManager.on("currentFileChange", attachListener);
        DocumentManager.on("currentDocumentLanguageChanged", attachListener).on("documentSaved documentRefreshed", function (event, document) {
            if (document === DocumentManager.getCurrentDocument()) {
                attachListener();
            }
        });
    });
});