﻿<?php
require_once('/var/www/embarc-utils/php/sessions.php');
$session = new SESSIONS();
$session->check();
?>
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="utf-8" />
    <title>Servers - Add</title>
    <link href="/embarc-utils/css/normalize.css" rel="stylesheet">
	<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.0/css/bootstrap.min.css">
	<link href="/embarc-utils/css/custom_style.css" rel="stylesheet">
	<link href="/embarc-utils/css/datepicker.css" rel="stylesheet">
    
    <script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>   
    <script src="//netdna.bootstrapcdn.com/bootstrap/3.0.0/js/bootstrap.min.js"></script>
	<script src="/embarc-utils/js/bootstrap-datepicker.js"></script>
    <script src="/embarc-utils/js/common.js"></script>
	<script src="/embarc-utils/js/servers.js"></script>
	<script src="/embarc-utils/js/static_data.js"></script>
	<script src="/embarc-utils/js/jquery.validate.min.js"></script>
	<script src="/embarc-utils/js/aes.js"></script>
	<script src="/embarc-utils/js/sha256.min.js"></script>

    <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="../assets/js/html5shiv.js"></script>
    <![endif]-->

</head>
<body>
	<nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
    	<div class="container">
        	<div class="navbar-header">
            	<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-ex1-collapse">
                        <span class="sr-only">Toggle navigation</span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>
                        <span class="icon-bar"></span>                        
                        <span class="icon-bar"></span>
                    </button>
                <a class="navbar-brand" href="/embarc-utils/dashboard.php">
                        Embarc
                    </a>
            </div>
            <div class="collapse navbar-collapse navbar-ex1-collapse nav-collapse-scrollable">
            	
                    <ul class="nav navbar-nav">                        
                        <li><a href="/embarc-utils/servers/server_list.php">List</a></li>
                        <li class="active"><a href="#">Add</a></li>
                        <li><a href="#">Kill</a></li>
					</ul>
                    <ul class="nav navbar-nav navbar-right">                      
                        <li><a href="/embarc-utils/php/main.php?util=login&fx=logout">Sign Out</a></li>
                    </ul>                
            </div>
    	</div>
    </nav>
    <div class="containt container">
	<div class="alert alert-danger" id="errorMessage-1"><strong>Oh snap!</strong> An error occurred, please try again. </div>
    	<div class="alert alert-success" id="successMessage-1"><strong>Well done!</strong> You have successfully added a new server. </div>

          <form class="form-horizontal" role="form" id="serverAddForm">
		  <div class="row">
			<h3>Client Details</h3>
			<hr>
			</div>
		  <div class="form-group">
                <label class="col-lg-4 control-label" for="company">Company</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="company" name="company" placeholder="Company" required>
                </div>
            </div>

            <div class="form-group">
                <label class="col-lg-4 control-label" for="contact">Contact Person</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="contact" name="contact" placeholder="Contact Person" required>
                </div>
            </div>            
            <div class="form-group">
                <label class="col-lg-4 control-label" for="email">Email</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="email" name="email" placeholder="Email (separate multiple by semicolon)">
                </div>
            </div>
            
            <div class="form-group">
                <label class="col-lg-4 control-label" for="country">Country</label>
                <div class="col-lg-4">
					<select class="form-control" id="country" name="country"></select>
                </div>
            </div>
            <div class="row">
			<h3>Server Details</h3>
			<hr>
			</div>
			<div class="form-group">
                <label class="col-lg-4 control-label" for="sw_version">Software Version</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="sw_version" name="sw_version" placeholder="4.1.2">
                </div>
            </div>
			<div class="form-group">
                <label class="col-lg-4 control-label" for="root_password">Root Password</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="root_password" name="root_password" placeholder="Root Password">
                </div>
            </div>
            <div class="form-group">
                <label class="col-lg-4 control-label" for="ip_address">IP</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="ip_address" name="ip_address" placeholder="127.0.0.1" required>
                </div>
            </div>
			<div class="form-group">
                <label class="col-lg-4 control-label" for="port">Port</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="port" name="port" placeholder="21000" required>
                </div>
            </div>
			<div class="form-group">
                <label class="col-lg-4 control-label" for="url">URL</label>
                <div class="col-lg-4">
					<div class="input-group">
						<span class="input-group-addon">http://</span>
						<input type="text" class="form-control" id="url" name="url">
					</div>
                </div>
            </div>
            <div class="row">
			<h3>Additional</h3>
			<hr>
			</div>
			<div class="form-group">
                <label class="col-lg-4 control-label" for="hosted_at">Hosted At</label>
                <div class="col-lg-4">
					<select class="form-control" id="hosted_at" name="hosted_at"></select>
                </div>
            </div>
			<div class="form-group">
                <label class="col-lg-4 control-label" for="server_name">Server Name</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="server_name" name="server_name" placeholder="Server Name">
                </div>
            </div>
			<div class="form-group">
                <label class="col-lg-4 control-label" for="user2_username">Secondary User</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="user2_username" name="user2_username" placeholder="Secondary User">
                </div>
            </div>
			<div class="form-group">
                <label class="col-lg-4 control-label" for="user2_password">Secondary User Password</label>
                <div class="col-lg-4">
                    <input type="text" class="form-control" id="user2_password" name="user2_password" placeholder="Secondary User Password">
                </div>
            </div>
            <div class="col-lg-offset-4 col-lg-4 margin-bottom">
                <button type="submit" class="btn btn-default" id="saveServerButton" data-loading-text="Saving...">Submit</button>
            </div>
        </form>      
    </div>
</body>
</html>