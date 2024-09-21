<script id="quiz-template" type="text/x-handlebars-template">

	<table class="table table-hover table-bordered">
		<tr>
			<td><strong>Difficulty</strong></td>
			<td>{{value}}</td>
		</tr>
		<tr>
			<td><strong>Category</strong></td>
			<td>{{{category.title}}}</td>
		</tr>
		<tr>
			<td><strong>Question</strong></td>
			<td>{{{question}}}</td>
		</tr>
		<tr>
			<td><strong>Answer</strong></td>
			<td>{{{answer}}}</td>
		</tr>
		<tr>
			<td><strong>Air Date</strong></td>
			<td>{{clean_time airdate}}</td>
		</tr>
        <tr>
			<td><strong>ID</strong></td>
			<td id="clue-id">{{id}}</td>
		</tr>
		<tr>
			<td><strong>Invalid Count <span class="glyphicon glyphicon-question-sign" data-toggle="tooltip" data-placement="top" title="Sometimes clues rely on images or sounds, mark as invalid to help clean the DB"></span></strong></td>
			<td>
                <div class="row">
                    <div class="col-sm-6">
                        <span id="invalid-count">
                        {{#if invalid_count}}
                            {{invalid_count}}
                        {{else}}
                            0
                        {{/if}}
                        </span>
                    </div>
                    <div class="col-sm-6">
                        <small><a href="#" class="pull-right" id="mark-invalid">Mark Invalid</a></small>
                    </div>
            </td>
		</tr>

	</table>
	<h5 class="left">Raw Response</h5>
	<div class="raw">
		<pre>{{json .}}</pre>
	</div>
</script>