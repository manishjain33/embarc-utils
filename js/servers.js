﻿$(window).load(init);

function init() {
    switch (location.pathname) {
        case "/embarc-utils/servers/server_add.php":
            server_add.initialize();
            break;

        case "/embarc-utils/servers/server_list.php":
            server_list.initialize();
            break;
    }
}

var server_hosting_locations = {
    "1": "esecuredata",
    "2": "Customer Location"
};

var server_add = {
    initialize: function () {
        var self = this;

        //focus on company to start quickly
        $("#company").focus();

        //fill list of countries
        fillDropDown2("#country", countriesMap, "name", null);

        //fill hosting locations
        fillDropDown2("#hosted_at", server_hosting_locations, null, null);

        //validate and submit form when done
        $("#serverAddForm").validate({
            highlight: function (element, errorClass, validClass) {
                $(element).parent().addClass("has-error");
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).parent().removeClass("has-error");
            },
            submitHandler: function (form) {
                //set current state of submit button to loading
                $("#saveServerButton").button('loading');

                //call method to submit this form
                self.save();

                //reset state of submit button
                $("#saveServerButton").button('reset');

                //focus on company to start again quickly
                $("#company").focus();

                return false;
            }
        });

        //check for edit mode
        if (getURLParameter("edit") == "1") {
            this.id = getURLParameter("id");

            this.get(this.fill);
        }

    },

    id: null,

    //get details of a server of specified ID
    get: function (callback) {
        var self = this;

        $.ajax({
            type: "GET",
            async: true,
            url: "/embarc-utils/php/main.php?util=servers&fx=get&id=" + this.id,
            success: function (data) {
                try {
                    data = getJSONFromString(data)[0];
                } catch (ex) {
                    console.log("unable to get data");
                    return;
                }
                
                if (callback) callback.apply(self, [data]);
            }
        });
    },

    //fill server details
    fill: function (details) {
        $.each(details, function (key, value) {
            $("#" + key).val(value);
        });
    },

    //save a new server
    save: function () {
        //hide error message if shown already
        $("#errorMessage-1").hide();

        var jsdata = createObject(["serverAddForm"]);

        $.ajax({
            type: "POST",
            async: true,
            data: jsdata,
            url: "/embarc-utils/php/main.php?util=servers&fx=add" + (getURLParameter("edit") == "1"?"&id=" + this.id:""),
            success: function (result) {
                if (strncmp(result, "SUCCESS", 7)) {
                    $("#successMessage-1").show();
                    window.setTimeout(function () {
                        $("#successMessage-1").hide();
                    }, 5000);
                } else {
                    $("#errorMessage-1").show();
                }
            }
        });
    }
};

var server_list = {
    initialize: function () {
        var self = this;

        //get list of servers and display
        this.get(this.printList);

        //check if desktop notifications are supported
        if (!window.webkitNotifications) {
            console.log("Desktop notifications are not supported!");
        }        
    },

    //get list of servers
    get: function (callback) {
        var self = this;

        $.ajax({
            type: "GET",
            async: true,
            url: "/embarc-utils/php/main.php?util=servers&fx=list",
            success: function (data) {
                try {
                    data = getJSONFromString(data);
                } catch (ex) {
                    console.log("no server available");
                    return;
                }
                
                if (callback) callback.apply(self, [data]);
            }
        });
    },

    //print list of servers
    printList: function (serversList) {
        for (var i = 0, l = serversList.length; i < l; i++) {
            this.addRow(serversList[i]);
        }
    },

    //reset a row to non-working state
    resetRow: function ($row) {
        //remove working and part working options
        $row.find(".panel-heading").removeClass("panel-heading-working");
        $row.find(".panel-heading").removeClass("panel-heading-partworking");

        //reset left status column
        $row.find(".left_status").html('<div class="col-lg-2 margin-bottom"></div>');
    },

    //update server row
    updateRow: function ($row, statusObject) {
        var totalProcesses = getObjectLength(statusObject.process || ""),
            stoppedProcesses = this.checkProceses(statusObject.process || ""),
            $left_status = $row.find(".left_status"),
            showNonWorkingProcesses = function (html) {
                createElement("<div/>", $left_status, { 'class': "col-lg-2 margin-bottom", 'html': html });
            };

        //remove working and part working options
        $row.find(".panel-heading").removeClass("panel-heading-working");
        $row.find(".panel-heading").removeClass("panel-heading-partworking");

        //clean left status column
        $left_status.html("");
        
        if (totalProcesses == stoppedProcesses.count && stoppedProcesses.count > 0) { // all processes are stopped
            //default is red

            //show non working processes
            showNonWorkingProcesses(stoppedProcesses.html);
        } else if (stoppedProcesses.count > 0 && totalProcesses != stoppedProcesses.count) { // some processes are stopped
            //color it amber
            $row.find(".panel-heading").addClass("panel-heading-partworking");

            //show non working processes
            showNonWorkingProcesses(stoppedProcesses.html);

            //create a new desktop notification
            chrome.notifications.create("1", {
                type: "basic",
                title: "Status",
                message: "Server needs a doctor!",
                iconUrl: "48.png"
            }, null);

            // show the notification.
            //notification.show();

        } else if (totalProcesses > 0 && stoppedProcesses.count == 0) { // disk or memory usage is high
            //calculate Disk and Memory usage
            var diskUsage = this.getPrimaryDiskUsage(statusObject.disk),
                memoryUsage = this.getPrimaryMemoryUsage(statusObject.mem);

            if (diskUsage > 80 || memoryUsage > 80) {
                //color it amber
                $row.find(".panel-heading").addClass("panel-heading-partworking");
            } else {
                //color it green
                $row.find(".panel-heading").addClass("panel-heading-working");
            }

            //show HDD and RAM status
            createElement("<div/>", $left_status, { 'class': "col-lg-1 margin-bottom", 'html': '<i class="fa fa-hdd" title="Disk Usage" style="font-size:20px;"></i><span>&nbsp;' + diskUsage + '%</span>' });
            createElement("<div/>", $left_status, { 'class': "col-lg-1 margin-bottom", 'html': '<i class="fa fa-tasks" title="Memory Usage" style="font-size:19px;"></i><span>&nbsp;' + memoryUsage + '%</span>' });
        } else { // not able to connect to server
            //show error message
            createElement("<div/>", $left_status, { 'class': "col-lg-2 margin-bottom", 'html': "unable to connect" });
            return;
        }

        /*
        * fill addtitional details since they are available here
        */
        //fill HDD usage
        var $hddDetailsContainer = $row.find(".hddDetailsContainer");
        $hddDetailsContainer.html(this.getDisksUsageDetails(statusObject.disk));

        //fill RAM usage
        var $ramDetailsContainer = $row.find(".ramDetailsContainer");
        $ramDetailsContainer.html(this.getMemoryUsageDetails(statusObject.mem));

        //fill server logs
        var $logFilesContainer = $row.find(".logFilesContainer");
        $logFilesContainer.html(this.getServerLogs(statusObject.logs));
    },

    //create a server row
    createRow: function (details) {
        var self = this;

        var panel = createElement("<div/>", null, { 'class': "panel panel-default" });
        var panelTitle = createElement("<h4/>", null, { 'class': "panel-title" }).appendTo(createElement("<div/>", panel, { 'class': "panel-heading panel-heading-notworking" }));
        var row = createElement("<div/>", panelTitle, { 'class': "row" });

        //left status column
        createElement("<div/>", null, { 'class': "col-lg-2 margin-bottom" }).appendTo(createElement("<div/>", row, {'class': "left_status"}));

        //company name
        createElement("<div/>", row, { 'class': "col-lg-2 margin-bottom", 'html': details.company || details.contact });

        //IP address
        var $ip_add = createElement("<code/>", null, { 'html': details.ip_address }).appendTo(createElement("<div/>", row, { 'class': "col-lg-2 margin-bottom" }));
        $ip_add.on("click", function () {
            //since only IE allows copy to clipboard automatically, due to security concrens we force user to manually copy password (but quickly)
            window.prompt("Press Ctrl+C followed by Enter", details.ip_address);

            //for flash based copy method visit: https://github.com/zeroclipboard/zeroclipboard
        });

        //root password
        var $root_pass = createElement("<code/>", null, { 'html': "copy password" }).appendTo(createElement("<div/>", row, { 'class': "col-lg-2 margin-bottom" }));
        $root_pass.on("click", function () {
            //since only IE allows copy to clipboard automatically, due to security concrens we force user to manually copy password (but quickly)
            window.prompt("Press Ctrl+C followed by Enter", details.root_password);

            //for flash based copy method visit: https://github.com/zeroclipboard/zeroclipboard
        });

        //URL
        createElement("<div/>", row, { 'class': "col-lg-3 margin-bottom", 'html': '<a href="http://' + details.url + '" target="_blank">' + details.url + '</a>' });

        //collapse button
        var buttonsContainer = createElement("<div/>", row, { 'class': "col-lg-1 margin-bottom" });
        createElement("<button/>", buttonsContainer, { 'type': "button", 'class': "close", 'aria-hidden': "true", 'data-toggle': "collapse", 'data-target': "#col" + details.id, 'html': '<i class="fa fa-chevron-circle-down icon-size"></i>' });

        //refresh button
        var $refreshButton = createElement("<button/>", buttonsContainer, { 'type': "button", 'class': "close", 'aria-hidden': "true", 'html': '<i class="fa fa-refresh icon-size"></i>&nbsp;' });
        $refreshButton.on("click", function () {
            self.resetRow(panel);
            self.getServerStatus(panel, details.ip_address, self.updateRow);
        });

        var panelCollapse = createElement("<div/>", panel, { 'class': "panel-collapse collapse", 'id': "col" + details.id });

        var hddDetailed = '<div class="col-lg-4 col-sm-4">\
        	<div class="well well-sm">\
            	<ul class="list-group">\
                  <li class="list-group-item active"><i class="fa fa-hdd" title="Disks Usage" style="font-size:20px;"></i><span>&nbsp;&nbsp;HDD</span></li>\
                    <div class="hddDetailsContainer"></div>\
                  <li class="list-group-item active"><i class="fa fa-tasks" title="Memory Usage" style="font-size:20px;"></i><span>&nbsp;&nbsp;RAM</span></li>\
                    <div class="ramDetailsContainer"></div>\
                </ul>\
            </div>\
        </div>';

        var logFilesDetailed = '<div class="col-lg-4 col-sm-4">\
        	<div class="well well-sm">\
            	<ul class="list-group">\
                  <li class="list-group-item active"><i class="fa fa-file-text-o" title="Server Logs" style="font-size:20px;"></i><span>&nbsp;&nbsp;Log Files</span></li>\
                    <div class="logFilesContainer"></div>\
                </ul>\
            </div>\
        </div>';

        var serverDetails = '<div class="col-lg-4 col-sm-4">\
        	<div class="well well-sm">\
            <ul class="list-group">\
                <li class="list-group-item active"><i class="fa fa-info" title="Server Details" style="font-size:20px;"></i><span>&nbsp;&nbsp;Information</span></li>\
                <div class="informationContainer">' +
                this.getServerDetails(details) +
                '</div>\
            </ul>\
            </div>\
        </div>';

        var panelBody = createElement("<div/>", panelCollapse, { 'class': "panel-body" });
        createElement("<div/>", panelBody, { 'class': "row", 'html': hddDetailed + logFilesDetailed + serverDetails });
        
        var buttonsContainer = createElement("<div/>", null, { 'class': "col-lg-4" }).appendTo(createElement("<div/>", panelBody, { 'class': "row" }));

        //edit button
        createElement("<a/>", buttonsContainer, { 'class': "btn btn-default", 'html': "Edit", 'target': "_blank", 'href': "server_add.php?edit=1&id=" + details.id });
        
        //delete button
        var $deleteButton = createElement("<button/>", buttonsContainer, { 'type': "button", 'class': "btn btn-danger margin-left", 'html': "Delete" });
        $deleteButton.on("click", function () {
            self.deleteServer(details.id, details.ip_address, panel);
        });
        
        return panel;
    },

    //delete a server
    deleteServer: function (id, ip, $row) {
        var confirm_ip = window.prompt("Are you ABSOLUTELY sure?\nThis action CANNOT be undone.\n\nPlease type in the IP address of this server to confirm.");
        if (confirm_ip != ip) {
            return;
        }

        $.ajax({
            type: "GET",
            async: true,
            url: "/embarc-utils/php/main.php?util=servers&fx=delete&id=" + id,
            success: function (result) {
                if (result == "SUCCESS") {
                    $row.remove();
                } else {
                    alert("Unable to delete server");
                }
            }
        });
    },

    //add a server row
    addRow: function (details) {
        var $row = this.createRow(details);
        $("#workingServersList").append($row);
        this.getServerStatus($row, details.ip_address, this.updateRow);
    },

    //check if all processes are working or not
    checkProceses: function (proc) {
        var result = { count: 0, html: "" };

        if (!result) return result;

        $.each(proc, function (key, value) {
            if (value == -1) {
                result.count++;
                result.html += '<span class="badge" title="' + key + '">' + key.substr(0, 1) + '</span> ';
            }
        });

        return result;
    },

    //get formatted usage of memory
    getMemoryUsageDetails: function (mems) {
        if (Array.isArray(mems)) {
            for (var i = 0, l = mems.length; i < l; i++) {
                if (mems[i][0] == "-/+") {//match -/+
                    return '<li class="list-group-item"><span class="badge" title="of ' + (+mems[i][2] + +mems[i][3]) + ' MB">' + Math.floor((+mems[i][2] / (+mems[i][2] + +mems[i][3])) * 100) + '%</span>RAM</li>';
                }
            }
        }
    },

    //get main memory usage
    getPrimaryMemoryUsage: function (mems) {
        if (Array.isArray(mems)) {
            for (var i = 0, l = mems.length; i < l; i++) {
                if (mems[i][0] == "-/+") {//match -/+
                    return Math.floor((+mems[i][2] / (+mems[i][2] + +mems[i][3])) * 100);
                }
            }
        }

        return "∞";
    },

    //get formatted usage of disks
    getDisksUsageDetails: function (disks) {
        var html = "";
        
        if (Array.isArray(disks)) {
            for (var i = 0, l = disks.length; i < l; i++) {
                html += '<li class="list-group-item"><span class="badge" title="of ' + parseInt(disks[i][3], 10) + ' MB">' + parseInt(disks[i][4], 10) + '%</span>' + disks[i][5] + '</li>';
            }
        }

        return html;
    },

    //get usage of /root disk
    getPrimaryDiskUsage: function (disks) {
        if (Array.isArray(disks)) {
            for (var i = 0, l = disks.length; i < l; i++) {
                if (disks[i][5] == "/") {//check for root partition
                    //return usage percent
                    return parseInt(disks[i][4], 10);
                }
            }
        }

        return "∞";
    },

    //get formatted server logs
    getServerLogs: function (logs) {
        var html = "";

        if (logs) {
            $.each(logs, function (key, value) {
                html += '<li class="list-group-item"><span class="badge" title="' + key + '">' + key.substr(0, 1) + '</span>' + value + '</li>';
            });
        }

        return html;
    },

    //get formatted server details
    getServerDetails: function (info) {
        var html = "";

        if (info) {
            $.each(info, function (key, value) {
                //skip some fields here
                if (key == "root_password" || key == "ip_address" || key == "url")
                    return;

                //label other fields or format accordingly
                if (value) {
                    switch (key) {
                        case "id":
                            html += '<li class="list-group-item">Server Status ID ' + value + '</li>';
                            break;

                        case "country":
                            html += '<li class="list-group-item">' + countriesMap[value]["name"] + '</li>';
                            break;

                        case "port":
                            html += '<li class="list-group-item">Find\'n\'Secure port ' + value + '</li>';
                            break;

                        case "hosted_at":
                            html += '<li class="list-group-item">Server is hosted @ ' + server_hosting_locations[value] + '</li>';
                            break;

                        case "server_name":
                            html += '<li class="list-group-item">Server is named ' + value + '</li>';
                            break;

                        case "sw_version":
                            html += '<li class="list-group-item">Running Find\'n\'Secure v' + value + '</li>';
                            break;

                        case "user2_username":
                            html += '<li class="list-group-item">Sec. User username - ' + value + '</li>';
                            break;

                        case "user2_password":
                            html += '<li class="list-group-item">Sec. User password - ' + value + '</li>';
                            break;

                        case "email":
                            //iterate multiple email IDs, separated by semicolon, and span over multiple lines
                            var emails = value.split(";");
                            for (var i = 0, l = emails.length; i < l; i++)
                                html += '<li class="list-group-item"><a href="mailto:' + emails[i] + '">' + emails[i] +' </a></li>';
                            break;

                        default:
                            html += '<li class="list-group-item">' + value + '</li>';
                            break;
                    }
                }
            });
        }

        return html;
    },

    //get status of server
    getServerStatus: function ($row, ip, callback) {
        var self = this;

        $.ajax({
            type: "GET",
            async: true,
            url: "/embarc-utils/php/main.php?util=servers&fx=status&ip=" + ip,
            success: function (result) {
                try {
                    result = getJSONFromString(result);
                } catch (ex) {
                    console.log("server " + ip + " not working");
                    result = "";
                }

                if (callback) callback.apply(self, [$row, result]);
            }
        });
    }
};