var PanelSetPlugIn = function(editor, url) {
    
    this.dpmup = {
        'psex': {'tooltip': 'Expansion of abbreviation', 'text': '()', 'cat': 'chars'}, 
    };
    
    function beforeChange() {
        //editor.undoManager.add();
    }
    
    function afterChange(cancel) {
        if (!cancel) {
            editor.undoManager.add();
            //editor.undoManager.redo();
        }
    }
    
    function setContent(content) {
        beforeChange();
        //editor.undoManager.transact(function () { editor.selection.setContent(content); });
        editor.selection.setContent(content);
        afterChange();
    }
    
    function getSelectionParents() {
        var parents = [];
        for (var i in [0, 1]) {
            var bm = editor.selection.getBookmark();
            // move to one end of the selection
            editor.selection.collapse(i == 0);
            parents.push(editor.selection.getNode().parentNode);
            editor.selection.moveToBookmark(bm);
        }
        return parents;
    }
    
    // Add a button that opens a window
    editor.addButton('pslinebreak', {
        text: 'Line Break',
        icon: false,
        onclick: function() {
            if (!editor.selection.isCollapsed()) return;
            editor.insertContent('<br/>');
        }
    });

    // Add a button that opens a window
    editor.addButton('psconvert', {
        /*text: '\u267B',*/
        text: '\u27F4',
        tooltip: 'Auto mark-up',
        icon: false,
        onclick: function() {
            $(editor.editorContainer).trigger('psconvert');
        }
    });

    // Add a button that opens a window
    editor.addButton('pssave', {
        /*text: '',*/
        tooltip: 'Save',
        icon: 'save',
        onclick: function() {
            $(editor.editorContainer).trigger('pssave');
        }
    });
    
    function addSpan(options) {
        // options
        //  tag: element name
        //  attributes: {'name': 'val'}
        //  conditions: {'collapsed': false, 'overlap': false, 'isparent': false, 'blank': false}
        //  processing: {'keep_spaces': false}
        options.conditions = options.conditions || {};
        $.extend(options.conditions, {'collapsed': false, 'overlap': false, 'isparent': false, 'blank': false});
        var conds = options.conditions;
        if ((conds.collapsed !== undefined) && (conds.collapsed !== editor.selection.isCollapsed())) return;
        var parents = getSelectionParents();
        if ((conds.overlap !== undefined) && (conds.overlap !== (parents[0] !== parents[1]))) return;
        var sel_cont = editor.selection.getContent();
        if ((conds.blank !== undefined) && (conds.blank !== (sel_cont.match(/^\s*$/g) !== null))) return;
        if ((conds.isparent !== undefined) && (conds.isparent !== (sel_cont.match(/</g) !== null))) return;
        
        // TODO: keep spaces outside the newly created span
        options.attributes = options.attributes || {};
        var attrStr = '';
        for (var k in options.attributes) {
            attrStr += ' data-dpt-'+k+'="'+options.attributes[k]+'"';
        };
        
        var parts = sel_cont.match(/^(\s*)(.*?)(\s*)$/);
        setContent(parts[1] + '<span data-dpt="' + options.tag + '" ' + attrStr + '">' + parts[2] + '</span>' + parts[3]);
    }
    
    // Expansion
    // http://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-expan.html
    editor.addButton('psex', {
        text: '()',
        tooltip: 'Expansion of abbreviation',
        icon: false,
        onclick: function() {
            addSpan({'tag': 'ex', 'attributes': {'cat': 'chars'}});
        }
    });

    // Supplied
    editor.addButton('pssupplied', {
        text: '\u271A',
        tooltip: 'Supplied text',
        icon: false,
        onclick: function() {
            addSpan({'tag': 'supplied', 'attributes': {'cat': 'chars'}});
        }
    });

    // Supplied
    // http://www.tei-c.org/release/doc/tei-p5-doc/en/html/ref-del.html
    editor.addButton('psdel', {
        /* text: '\u271A', */
        tooltip: 'Deleted',
        icon: 'strikethrough',
        onclick: function() {
            if (editor.selection.isCollapsed()) return;
            var parents = getSelectionParents();
            if (parents[0] !== parents[1]) return;
            var sel_cont = editor.selection.getContent();
            /*
            if (sel_cont.match(/^\s*$/g)) return;
            if (sel_cont.match(/</g)) return;
            */
            
            // TODO: keep spaces outside the newly created span
            setContent('<span data-dpt="del" data-dpt-cat="words">' + sel_cont + '</span>');
        }
    });

    // Clear the markup
    // Clear digipal elements within or directly above the selection 
    editor.addButton('psclear', {
        text: '\u274C',
        tooltip: 'Clear Markup',
        icon: false,
        onclick: function() {
            // remove parent tags
            // TODO: don't remove non data-dpt?
            var parents = getSelectionParents();
            
            var changed = false;
            
            beforeChange();

            $(parents).each(function (index, parent) {
                // don't remove second parent if same as first
                if ((index == 0) || (parents[0] !== parents[1])) {
                    // make sure we remove only data-dpt parents and not any parent element
                    var $panelset_parent = $(parent).closest('[data-dpt]');
                    $panelset_parent.replaceWith($panelset_parent.html());
                    // TODO: not exact... $panelset_parent can be empty
                    changed = true;
                }
            });
            
            if (!editor.selection.isCollapsed()) {
                // TODO: remove all the data-dpt elements inside the selection
                var sel_cont = editor.selection.getContent();
                sel_cont = sel_cont.replace(/<[^>]*>/g, '');
                editor.selection.setContent(sel_cont);
                //ed.selection.moveToBookmark(bm);
                changed = true;
            }
            
            afterChange(!changed);
        }
    });
    
    // Clauses
    editor.addButton('psclause', function() {
        var items = [{text: 'Address', value: 'address'}, {text: 'Disposition', value: 'disposition'}, {text: 'Witnesses', value: 'witnesses'}];
    
        return {
            type: 'listbox',
            text: 'Clause',
            tooltip: 'Clause',
            values: items,
            fixedWidth: true,
            onclick: function(e) {
                if (e.target.tagName !== 'BUTTON') {
                    if (editor.selection.isCollapsed()) return;
                    var parents = getSelectionParents();
                    if (parents[0] !== parents[1]) return;
                    var sel_cont = editor.selection.getContent();
                    if (sel_cont.match(/^\s*$/g)) return;
                    //if (sel_cont.match(/</g)) return;
                    
                    // TODO: keep spaces outside the newly created span
                    setContent('<span data-dpt="clause"  data-dpt-cat="words" data-dpt-type="'+e.control.settings.value+'">' + sel_cont + '</span>');
                }
            }
        };
    });

    // Paragraph merger
    editor.addButton('psparagraph', {
        text: 'Merge Paragraphs',
        icon: false,
        onclick: function() {
            if (editor.selection.isCollapsed()) return;

            var parents = getSelectionParents();
            
            // get the p above each parent
            // make sure the 

            console.log((parents[0] === parents[1]) ? 'Same parent' : 'Different parents');
            console.log(parents);

            // check that the selection doesn't contain fragmentary elements.
            // e.g. '1</span>2' or '1<span>2'
            var yo = 0;
            
            //editor.insertContent('<br/>');
        }
    });
    
};

tinymce.PluginManager.add('panelset', PanelSetPlugIn);