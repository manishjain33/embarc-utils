﻿$(window).load(init);

function init() {
    switch (location.pathname) {
        case "/embarc-utils/inventory/stock_in.php":
            stock_in.initialize();
            break;

        case "/embarc-utils/inventory/stock_out.php":
            stock_out.initialize();
            break;

        case "/embarc-utils/inventory/preferences.php":
            preferences.initialize();
            break;

        case "/embarc-utils/inventory/stock_finder.php":
            stock_finder.initialize();
            break;
    }
}

var stock_in = {
    initialize: function () {
        var self = this;

        //initialize datepicker
        $('.datepicker').datepicker({
            'autoclose': true,
            'format': "dd/mm/yyyy"
        });

        //add change listener on model drop down
        $("#model").on('change', function (ev) {
            self.fillModelDetails($(this).val());
        });

        //validate and submit form when done
        $("#stockInForm").validate({
            highlight: function (element, errorClass, validClass) {
                $(element).parent().addClass("has-error");
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).parent().removeClass("has-error");
            },
            submitHandler: function (form) {
                //set current state of submit button to loading
                $("#saveStockButton").button('loading');

                window.setTimeout(function () {
                    //call method to submit this form
                    self.saveStock();

                    //reset state of submit button
                    $("#saveStockButton").button('reset');

                    //focus on serial number to start again quickly
                    $("#serial").focus();
                }, (self.defaults.waitTime * 1000));
                return false;
            }
        });

        var $in_invoice = $("#in_invoice"),
            $serial = $("#serial")

        //set focus to invoice number by default
        $in_invoice.focus();

        //prevent form submit on enter press on invoice number (useful when scanned via barcode scanner) also set focus to serial number if required
        $($in_invoice).keypress(function (ev) {
            if (ev.which === 13) {
                ev.preventDefault();
                $serial.focus();
            }
        });

        //prevent form submit on enter press on serial number (useful when scanned via barcode scanner) also set focus to IMEI if required
        $($serial).keypress(function (ev) {
            if (ev.which === 13) {
                ev.preventDefault();
                $("#imei").focus();
            }
        });

        //fetch list of trackers from server
        this.getTrackersList();

        //fetch preferences and update defaults
        preferences.get.apply(this, [this.updateDefaults]);
    },

    getTrackersList: function () {
        var self = this;

        $.ajax({
            type: "GET",
            url: "/embarc-utils/php/main.php?util=inventory&fx=getTrackers",
            async: true,
            success: function (data) {
                data = getJSONFromString(data);
                
                //save list of trackers
                self.trackers = data;

                //fill trackers in model select drop down
                fillDropDown("#model", self.trackers, "model", "model");

                //set default values
                if (self.setDefaults) self.setDefaults();
            }
        });
    },

    fillModelDetails: function (model) {
        for (var i = 0; i < this.trackers.length; i++) {
            if (model == this.trackers[i].model) {
                $("#vendor").val(this.trackers[i].vendorName);
                $("#warranty").val(this.trackers[i].warranty);
            }
        }
    },

    defaults: {
        'serial': "",
        'imei': "",
        'model': "VT-62",
        'dateOfPurchase': "today",
        'invoice_no': ""
    },

    trackers: [],

    updateDefaults: function (preferences) {
        if (!preferences) preferences = {};

        this.defaults['autoSave'] = + preferences.autoSaveIN || 0;
        this.defaults['model'] = preferences.model || this.defaults.model;
        this.defaults['waitTime'] = + preferences.waitTimeIN || 1;

        //disable auto save if required
        if (!this.defaults.autoSave) {
            //prevent form submit on enter press on IMEI number (useful when scanned via barcode scanner)
            $("#imei").keypress(function (ev) {
                if (ev.which === 13) {
                    ev.preventDefault();
                }
            });
        }
    },

    //set default values for each form field
    setDefaults: function () {
        var self = this;

        $.each(this.defaults, function (key, value) {
            //set today's date
            if (key === "dateOfPurchase" && value === "today") {
                $('.datepicker').datepicker('setDate', new Date());
            } else {
                if (key == "model") self.fillModelDetails(value);

                //set all other values
                $("#" + key).val(value);
            }
        });
    },

    saveStock: function () {
        var jsn = createObject(["stockInForm"]),
            self = this;
        dropElements(jsn, ["warranty", "vendor"]);
        jsn.dateOfPurchase = getFormattedDate(jsn.dateOfPurchase);
        
        $.ajax({
            type: "POST",
            url: "/embarc-utils/php/main.php?util=inventory&fx=saveStockItem",
            async: true,
            data: jsn,
            success: function (result) {
                var $errorMsg = $("#errorMessage-1"),
                    $successMsg = $("#successMessage-1"),
                    $imeiExistsMsg = $("#errorMessage-2");
                
                if (strncmp(result, "SUCCESS", 7)) {
                    //hide error message and show success message
                    $errorMsg.hide();
                    $imeiExistsMsg.hide();
                    $successMsg.show();

                    //clear quick fill fields
                    self.clearToQuickFill();

                    //hide success message after 5 seconds
                    window.setTimeout(function () {
                        $successMsg.hide();
                    }, 5000);
                } else if (strncmp(result, "IMEI_EXISTS", 11)) {
                    $successMsg.hide();
                    $errorMsg.hide();
                    $imeiExistsMsg.show();
                } else {
                    //show error message and hide success message
                    $successMsg.hide();
                    $imeiExistsMsg.hide();
                    $errorMsg.show();
                }
            }
        });
    },

    clearToQuickFill: function () {
        $("#imei,#serial").val("");
    }
};

var stock_out = {
    initialize: function () {
        var self = this;

        //initialize datepicker
        $('.datepicker').datepicker({
            'autoclose': true,
            'format': "dd/mm/yyyy"
        });

        var $out_invoice = $("#out_invoice"),
            $imei = $("#imei");

        //initially, set focus to invoice number
        $out_invoice.focus();

        $imei.on("blur", this.checkForItemInStock);

        $imei.keypress(function (ev) {
            if (ev.which === 13) {
                ev.preventDefault();
                $imei.blur();
            }
        });

        //validate and submit form when done
        $("#stockOutForm").validate({
            highlight: function (element, errorClass, validClass) {
                $(element).parent().addClass("has-error");
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).parent().removeClass("has-error");
            },
            submitHandler: function (form) {
                //set current state of submit button to loading
                $("#saveStockButton").button('loading');

                //call method to submit this form after a few wait seconds
                window.setTimeout(function () {
                    self.saveStockOut();

                    //reset button loading state
                    $("#saveStockButton").button('reset');

                    //focus on serial number to start again quickly
                    $imei.focus();
                }, (self.defaults.waitTime * 1000));

                return false;
            }
        });

        //get list of clients
        this.getClients();

        //fetch preferences and update defaults
        preferences.get.apply(this, [this.updateDefaults]);
    },

    checkForItemInStock: function () {
        var self = this,
            $errorMsg = $("#errorMessage-1"),
                    $imei_no_exist = $("#errorMessage-2"),
                    $successMsg = $("#successMessage-1");

        $.ajax({
            type: "GET",
            async: true,
            url: "/embarc-utils/php/main.php?util=inventory&fx=getItemInStock&prop=imei&val=" + $(this).val(),
            success: function (data) {
                if (strncmp(data, "ERROR", 5)) {
                    //show an error
                    $errorMsg.hide();
                    $imei_no_exist.show();
                    $successMsg.hide();

                    //clean up
                    $("#serial").val("");
                    $("#model").val("");
                    $("#id").val("");
                } else {
                    //hide the error message, if visible, or anyways
                    $errorMsg.hide();
                    $imei_no_exist.hide();
                    $successMsg.hide();

                    //fill it up
                    data = getJSONFromString(data);
                    $("#serial").val(data["serial"]);
                    $("#model").val(data["model"]);
                    $("#id").val(data["id"]);
                    
                    //submit form if preference allows
                    if(self.defaults.autoSave) $("#stockOutForm").submit();
                }
            }
        });
    },

    getClients: function () {
        var self = this;

        $.ajax({
            type: "GET",
            url: "/embarc-utils/php/main.php?util=inventory&fx=getClients",
            async: true,
            success: function (data) {
                data = getJSONFromString(data);
                
                //fill clients list in client select drop down
                fillDropDown("#clientID", data, "name", "id");
            }
        });
    },

    defaults: {
        'serial': "",
        'imei': "",
        'out_warranty': "12",
        'dateOfSale': "today",
        'out_invoice_no': ""
    },

    updateDefaults: function (preferences) {
        if (!preferences) preferences = {};

        this.defaults['autoSave'] = +preferences.autoSaveOUT || 0;
        this.defaults['waitTime'] = +preferences.waitTimeOUT || 1;
        this.defaults['out_warranty'] = +preferences.out_warranty || this.defaults.out_warranty;

        //fill in default values
        this.setDefaults();
    },

    //set default values for each form field
    setDefaults: function () {
        $.each(this.defaults, function (key, value) {
            //set today's date
            if (key === "dateOfSale" && value === "today")
                $('.datepicker').datepicker('setDate', new Date());
            else
                //set all other values
                $("#" + key).val(value);
        });
    },

    saveStockOut: function () {
        var jsn = createObject(["stockOutForm"]),
            self = this;
        dropElements(jsn, ["model", "serial"]);
        jsn.dateOfSale = getFormattedDate(jsn.dateOfSale);
        
        $.ajax({
            type: "POST",
            async: true,
            url: "/embarc-utils/php/main.php?util=inventory&fx=updateStockItem",
            data: jsn,
            success: function (result) {
                var $errorMsg = $("#errorMessage-1"),
                    $imei_no_exist = $("#errorMessage-2"),
                    $successMsg = $("#successMessage-1");

                if (strncmp(result, "SUCCESS", 7)) {
                    //hide error message and show success message
                    $errorMsg.hide();
                    $imei_no_exist.hide();
                    $successMsg.show();

                    //hide success message after 5 seconds
                    window.setTimeout(function () {
                        $successMsg.hide();
                    }, 5000);

                    //clear quick fill fields
                    self.clearToQuickFill();
                } else if (strncmp(result, "IMEI_NOT_STOCK", 14)) {
                    //show message that IMEI number does not exist
                    $errorMsg.hide();
                    $imei_no_exist.show();
                    $successMsg.hide();
                } else {
                    //an error occured - dunno what?
                    $errorMsg.show();
                    $imei_no_exist.hide();
                    $successMsg.hide();
                }
            }
        });
    },

    clearToQuickFill: function () {
        $("#imei,#serial,#model").val("");
    }
};

var preferences = {
    initialize: function () {
        var self = this;

        stock_in.getTrackersList.apply(this);

        //remove independent 'required' messages
        jQuery.validator.messages.required = "";

        $("#preferencesForm").validate({
            highlight: function (element, errorClass, validClass) {
                $(element).parent().addClass("has-error");
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).parent().removeClass("has-error");
            },
            submitHandler: function (form) {
                self.savePreferences();

                return false;
            },
            invalidHandler: function (ev, validator) {
                if (validator.numberOfInvalids()) {
                    $("#errorMessage-1").show();
                } else {
                    $("#errorMessage-1").hide();
                }
            }
        });
    },

    setDefaults: function () {
        //fill default preferences
        this.get(this.fill);
    },

    get: function (callback) {
        var self = this;

        $.ajax({
            type: "GET",
            async: true,
            url: "/embarc-utils/php/main.php?util=misc&fx=getPreferences&module=2",
            success: function (data) {
                try {
                    data = getJSONFromString(data);
                } catch (ex) {
                    console("Inventory: preferences not found");
                    return;
                }

                if (callback) callback.apply(self, [data]);
            }
        });
    },

    savePreferences: function () {
        $("#errorMessage-1").hide();
        $("#successMessage-1").hide();

        var jsdata = createObject(["preferencesForm"]);
        
        $.ajax({
            type: "POST",
            async: true,
            data: jsdata,
            url: "/embarc-utils/php/main.php?util=misc&fx=savePreferences&module=2",
            success: function (result) {
                if (strncmp(result, "success", 7)) {
                    $("#successMessage-1").show();

                    window.setTimeout(function () {
                        $("#successMessage-1").hide();
                    }, 5000);
                } else {
                    $("#errorMessage-1").show();
                }
            }
        });
    },

    trackers: [],

    fill: function (prefs) {
        var formFiller = new FormFiller(document.getElementById("preferencesForm", ""));

        formFiller.fillData(prefs);
    }
};

var stock_finder = {
    initialize: function () {
        var self = this;

        //attach change event on search criteria
        $("#stockSearchForm input[type=radio]").on("change", function () {
            self.changeCriteria(this.value);
        });

        //start with search textbox focussed
        $("#searchTextbox").focus();
        
        //get list of trackers
        this.getTrackersList(function (trackersList) {
            //save list of trackers
            self.trackers = trackersList;

            //if trackers list is scheduled to be filled on load
            if (self.doFillOnLoad.models) {
                self.fillTrackersList();
                self.doFillOnLoad.models = false;
            }
        });

        //get list of clients
        this.getClientsList(function (clientsList) {
            //save list of clients
            self.clients = clientsList;

            //if clients list is scheduled to be filled on load
            if (self.doFillOnLoad.clients) {
                self.fillClientsList();
                self.doFillOnLoad.clients = false;
            }
        });

        //find something in stock
        $("#searchStockButton").on("click", function () {
            self.find();
        });
    },

    changeCriteria: function (criteria) {
        var $searchDropdown = $("#searchDropdown"),
            $searchTextbox = $("#searchTextbox");

        $searchDropdown.val("");
        $searchTextbox.val("");

        switch (criteria) {
            case "serial":
            case "imei":
                //hide dropdown and show textbox
                $searchDropdown.hide();
                $searchTextbox.show();
                break;

            case "model":
                //show dropdown and hide textbox
                $searchDropdown.show();
                $searchTextbox.hide();

                //populate list of trackers if available otherwise schedule for later
                if (this.trackers.length > 0) {
                    this.fillTrackersList();
                } else {
                    this.doFillOnLoad.models = true;
                    this.doFillOnLoad.clients = false;
                }
                break;

            case "client":
                //show dropdown and hide textbox
                $searchDropdown.show();
                $searchTextbox.hide();

                //populate list of clients if available otherwise schedule for later
                if (this.clients.length > 0) {
                    this.fillClientsList();
                } else {
                    this.doFillOnLoad.models = false;
                    this.doFillOnLoad.clients = true;
                }
                break;
        }
    },

    doFillOnLoad: {
        models: false,
        clients: false
    },

    trackers: [],

    getTrackersList: function (callback) {
        var self = this;

        $.ajax({
            type: "GET",
            url: "/embarc-utils/php/main.php?util=inventory&fx=getTrackers",
            async: true,
            success: function (data) {
                data = getJSONFromString(data);

                if (callback) callback(data);
            }
        });
    },

    fillTrackersList: function () {
        $("#searchDropdown").html("");

        //fill trackers in model select drop down
        fillDropDown("#searchDropdown", this.trackers, "model", "model");
    },

    clients: [],

    clientsMap: {},

    getClientsList: function (callback) {
        $.ajax({
            type: "GET",
            url: "/embarc-utils/php/main.php?util=inventory&fx=getClients",
            async: true,
            success: function (data) {
                data = getJSONFromString(data);

                if (callback) callback(data);
            }
        });
    },

    fillClientsList: function () {
        $("#searchDropdown").html("");

        //fill clients list in client select drop down
        fillDropDown("#searchDropdown", this.clients, "name", "id");
    },

    find: function () {
        var jsdata = createObject(["stockSearchForm"]);
        if (jsdata.query1 === "" && jsdata.query2 === "") return;

        jsdata.query = jsdata.query1 || jsdata.query2;
        delete jsdata.query1;
        delete jsdata.query2;
        
        $.ajax({
            type: "POST",
            async: true,
            data: jsdata,
            url: "/embarc-utils/php/main.php?util=inventory&fx=search",
            success: function (data) {
                data = getJSONFromString(data);
                debugger;
            }
        });
    },

    fillResultsInTable: function () {

    }
};