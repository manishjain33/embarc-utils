<?php
require_once('/var/www/embarc-utils/php/sessions.php');
$session = new SESSIONS();
$session->check();
?>
<!DOCTYPE html>
<html>
<head>
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta charset="utf-8" />
    <title>Alerts & Reminders - Schedule</title>
    <link href="/embarc-utils/css/normalize.css" rel="stylesheet">
	<link rel="stylesheet" href="//netdna.bootstrapcdn.com/bootstrap/3.0.3/css/bootstrap.min.css">
    <link href="//netdna.bootstrapcdn.com/font-awesome/4.0.3/css/font-awesome.css" rel="stylesheet">
	<link href="/embarc-utils/css/select2.css" rel="stylesheet">
    <link href="/embarc-utils/css/custom_style.css" rel="stylesheet">
    
    <script src="//ajax.googleapis.com/ajax/libs/jquery/2.0.3/jquery.min.js"></script>   
    <script src="//netdna.bootstrapcdn.com/bootstrap/3.0.3/js/bootstrap.min.js"></script>
	<script src="/embarc-utils/js/jquery.validate.min.js"></script>
	<script src="/embarc-utils/js/select2.js"></script>
	<script>window.eu = { 'id': "aNr_schedule" }</script>
    <script src="/embarc-utils/js/common.js"></script>
	<script src="/embarc-utils/js/alerts_reminders.js"></script>

    <!-- HTML5 shim, for IE6-8 support of HTML5 elements -->
    <!--[if lt IE 9]>
      <script src="../assets/js/html5shiv.js"></script>
    <![endif]-->

</head>
<body>
<div id="wrap">
	<nav class="navbar navbar-inverse navbar-fixed-top" role="navigation">
    	<div class="container">
        	<div class="navbar-header">
            	<button type="button" class="navbar-toggle" data-toggle="collapse" data-target=".navbar-ex1-collapse">
                        <span class="sr-only">Toggle navigation</span>
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
						<li><a href="#">List</a></li>
                        <li class="active"><a href="#">Schedule</a></li>
					</ul>
                    <ul class="nav navbar-nav navbar-right">                      
                        <li><a href="/embarc-utils/php/main.php?util=login&fx=logout">Sign Out</a></li>
                    </ul>                
            </div>
    	</div>
    </nav>
    <div class="containt container">
		<div class="alert alert-danger" id="errorMessage-1"><strong>Oh snap!</strong> An error occurred, please try again. </div>
    	<div class="alert alert-success" id="successMessage-1"><strong>Well done!</strong> Your preferences have been saved successfully. </div>
		<form class="form-horizontal" role="form" id="datacentresForm">
		  	<div class="row">
                <h3>Schedule alerts for your modules</h3>
				<p>All scheduled mails will be sent to your registered email ID</p>
                <hr>
			</div>
		 	 <div class="form-group">
                <label class="col-lg-4 control-label" for="module">Module</label>
                <div class="col-lg-4">
					<select class="form-control" id="module" name="module"></select>
                </div>
            </div>
            <div class="form-group">
                <label class="col-lg-4 control-label" for="alerts">Alerts</label>
                <div class="col-lg-4">
                    <select class="form-control" id="alerts" name="alerts" multiple></select>
                </div>
            </div>
			<div class="form-group">
				<label class="col-lg-4 control-label" for="reminders">Reminders</label>
				<div class="col-lg-4">
					<select class="form-control" id="reminders" name="reminders" multiple></select>
				</div>
			</div>
			<div class="form-group">
				<div class="col-lg-offset-4 col-lg-4">
					<div class="checkbox">
						<label>
							<input type="checkbox" id="mail" name="mail" />
							Receive an e-mail
						</label>
					</div>
				</div>
			</div>
			<div class="form-group">
				<div class="col-lg-offset-4 col-lg-4">
					<div class="checkbox">
						<label>
							<input type="checkbox" id="text" name="text" disabled />
							Receive a text message
						</label>
					</div>
				</div>
			</div>
	        <div class="col-lg-offset-4 col-lg-4 margin-bottom">
                <button type="submit" class="btn btn-block btn-primary">Save</button>
            </div>

        </form>
</div>
<div id="push"></div>
</div>
<footer>
	<div id="footer">
		<div class="bs-footer">
			<div class="container">
				<div class="row">
				This work is licensed under the <a href="http://creativecommons.org/licenses/by-sa/3.0/">CC By-SA 3.0</a>, without all the cruft that would otherwise be
				put at the bottom of the page.
				</div>
			</div>
		</div>
   </div>
</footer>
                
    
</body>
</html>