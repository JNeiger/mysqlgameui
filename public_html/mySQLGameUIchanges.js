var myRowId = getCurrentRowId();
var rows = [];

var myRows = []; //populated with all your row ids
var _rowData = {}; //rowData[row] = [];
var _currentRow = -1;

var df = 0;
var dm = 0;

//IMPORTANT: when adding new columns, ALWAYS add them to the end of 'myRowsHeaders'. you can change their location in 'myRowsHeaderIdx'
var myRowsHeaders = ['id','name', 'owner', '#MF', 'money', '#FF', 'fuel', '#Atk', '*AM', '#Def', '*DM', '#RC', 'can buy', 'can defend', '#', 'scan'];
var myRowsHeaderIdx = [14, 0, 15, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13 ];
var myRowsWidths =   [40,   100,   80,      45,     80,     50,     80,      80,     45,    100,   45,    45,    80,       80,       25,      55]; //these correspond to the real indexes of 'myRowsHeaders' not the remapped indexes of 'myRowsHeaderIdx'

row_format[7][1] = row_format[7][2] = '#_Atk';
row_format[8][1] = row_format[8][2] = '*_Atk';
row_format[9][1] = row_format[9][2] = '#_Def';
row_format[10][1] = row_format[10][2] = '*_Def';

row_format[3][1] = row_format[3][2] = '#MF';
row_format[5][1] = row_format[5][2] = '#FF';
row_format[4][1] = row_format[4][2] = 'money';
row_format[11][1] = row_format[11][2] = '#RC'

function transferAll(){
	var rows = getMyRows();
	var target = prompt("row to transfer ALL ROWS fuel/money to?", "");
	var rows = prompt("Rows doing the sending are", rows.join(" ")).split(" ");
	var sec = 2;
	var calls = [];
	var j = 0;
	var arr = [];
	var totalM, totalF;
	var count = 1;
	for(var i = 0; i < rows.length; i++){
		var stuff = getMaxTransferAttackerAndFuelAndMoney(rows[i], target); // attackers, money, fuel
		var maxMoney = stuff[1];
		arr[i] = maxMoney-100;
		totalM += maxMoney;
		if(maxMoney > 500){
			setTimeout(function(){ 
				$.post("/update/queries", {"":rows[j], "row_id": rows[j], "target":target,"query":"TransferMoney","submit": "go", "amount":arr[j]});
				j++;
				updateRows();
			}, sec * (count) * 1000 + 250);
			console.log("m:"+sec * (count));
			count++;
		}
	}
	
	setTimeout(function(){
		var k = 0;
		var arrk = [];
		for(var i = 0; i < rows.length; i++){
			var stuff = getMaxTransferAttackerAndFuelAndMoney(rows[i], target); // attackers, money, fuel
			var maxF = stuff[2];
			arrk[i] = maxF-100;
			totalF += maxF;
			if(maxF > 1000){
				setTimeout(function(){ 
					$.post("/update/queries", {"":rows[k], "row_id": rows[k], "target":target,"query":"TransferFuel","submit": "go", "amount":arrk[k]});
					k++;
					updateRows();
				}, sec * (count) * 1000 + 250);
				console.log("m:"+sec * (count));
				count++;
			}
		}
	}, (count + 1) * sec);
	

	
}

function select_row_browse(arg){
	//if(speedup) return;
	_currentRow = arg;
	if(arg !== "TOTALS"){
		browse();
		select_row(arg);
	}
}

function getMyRows(){
  return readCookie("myRows").split(",");
}

function getMyRowsDropdown(){
	var inp = $("#query_list_3").find("input[name=target]");
	var ammt = $("#query_list_3").find("input[name=amount]");
	var html = "<select>";
	var rr = getMyRows();
	if(rr === null) rr = myRows;
	for(var i = 0; i < rr.length; i++){
		html += '<option value ="'+rr[i]+'">'+rr[i]+'</option>';
	}
	html += "</select>";
	inp.each(function(i,n){
		$(this).siblings("select").remove();
		$(this).after(html);
		$(this).hide();
		$(this).val(rr[0]); //here
		var trans = getMaxTransferAttackerAndFuelAndMoney(getCurrentRowId(), rr[0]);

		switch(i){
			case 0: //attckers
				$(ammt[0]).val(trans[0]);
				break;
			case 1: //money
				$(ammt[1]).val(trans[1]);
				break;
			case 2: //fuel
				$(ammt[2]).val(trans[2]);
				break;
		}
		var that = $(this);
		$(this).siblings("select").change(function(){
			var otherRow = $(this).val();
			that.val(otherRow);
			var trans = getMaxTransferAttackerAndFuelAndMoney(getCurrentRowId(), otherRow);
			switch(i){
				case 0: //attackers
					$(ammt[0]).val(trans[0]);
					break;
				case 1: //money
					$(ammt[1]).val(trans[1]);
					break;
				case 2: //fuel
					$(ammt[2]).val(trans[2]);
					break;
			}
		});
	});
}

function getMaxTransferAttackerAndFuelAndMoney(myRow, otherRow){

	var currRow = getRowData(myRow, 0);
	var currA = getRowData(myRow, 7);
	var currAM = getRowData(myRow, 8);
	var currF = getRowData(myRow, 6);
	var currM = getRowData(myRow, 4);

	var distance = Math.abs(currRow - otherRow);
	if (currAM > 2) {
			currAM = currAM - 2;
	}
	currAM = Math.floor(currAM/3);
	var fuelCostFactor = 1/Math.pow(2,currAM);


	var transAttackers = Math.max(Math.min(currA,Math.floor(currF/(distance*fuelCostFactor))),0);
	var transFuel = Math.floor((currF/(100+(distance*fuelCostFactor))*100));
	var transMoney = Math.max(Math.min(currM,Math.floor(currF/(distance*fuelCostFactor))*100),0);
	return [transAttackers, transMoney, transFuel]
}

function scanAroundRow(row, callback){
  var start = row - (row % 10);
  if(!speedup) $.post("/update/browse", {row_id: row, "start": start, "submit": "go"}, callback);
}

function getRowData(row,idx){
	/*
	0 is row ID
	4 is money
	6 if fuel
	7 is attackers
	8 is atkMult
	9 is defenders
	10 is defenseMult
	*/
	if(typeof _rowData !== "undefined" && typeof _rowData[row] !== "undefined" && newUpdates){
		return parseInt(_rowData[row][idx],10);
	} else {
		return parseInt($($("td[onClick^=select_row_browse("+row+")]")[idx]).html(),10);
	}
}

function setInfo(st){
	$("#info").html(st);
}

updateRows();
function moveHeader(index, dir){
	var newIndex = index + dir;
	if((newIndex < 0) || (newIndex >= myRowsHeaderIdx.length)) return;

	var old = myRowsHeaderIdx[index];
	var neww = myRowsHeaderIdx[newIndex];
	myRowsHeaderIdx[index] = neww;
	myRowsHeaderIdx[newIndex] = old;
	updateRows();
	createCookie("myRowsHeaderIdx", myRowsHeaderIdx.join(","), 1000);
}
function removeHeader(index){
	myRowsHeaderIdxRemoved.push(myRowsHeaderIdx[index]);
	myRowsHeaderIdx.splice(index, 1);
	updateRows();
	createCookie("myRowsHeaderIdx", myRowsHeaderIdx.join(","), 1000);
	createCookie("myRowsHeaderIdxRemoved", myRowsHeaderIdxRemoved.join(","), 1000);
}
function addHeader(i){
	myRowsHeaderIdx.push(myRowsHeaderIdxRemoved[i]);
	myRowsHeaderIdxRemoved.splice(i, 1);
	createCookie("myRowsHeaderIdx", myRowsHeaderIdx.join(","), 1000);
	createCookie("myRowsHeaderIdxRemoved", myRowsHeaderIdxRemoved.join(","), 1000);
	updateRows();
}

$("#rows_scroll").css("overflow-x","visible");
$("#rows_scroll").css("width", "745px");
$('#rows_content').css("width","100%")


var sortCol = [0,1];
function sortRows(data){

	sortAsc = (sortCol[1] < 0);
	sortColumn = sortCol[0];

	var sortUp = function(a,b) {
		return a[sortCol[0]] - b[sortCol[0]];
	};
	var sortDown = function(a,b) {
		return b[sortCol[0]] - a[sortCol[0]];
	};
	var sortFunc = sortAsc ? sortUp : sortDown;

	data.sort(sortFunc);

	return data;
}

function setSortCol(col){
  col = myRowsHeaderIdx[col]
	if(sortCol[0] == col){
		sortCol[1] *= -1;
	} else {
		sortCol[0] = col;
		sortCol[1] = 1;
	}
	updateRows();
}

var totalsRow = [];
function update_rows(data)
{

	myRows = [];
	if (!data.length) return;
	$('#rows #no_rows').remove();
	method = data.shift();
	if (method == 'refresh') {

		$('#rows_content').empty();
		$('#rows_headers').empty();
		rowID(data.shift());
		headers = myRowsHeaders;




	  headerStr = '<tr class="odd-col" style="background-color:#40FF40;">';
	  for(x=0; x<headers.length; x++){
	  	var realIndex = myRowsHeaderIdx[x];
	  	if(typeof realIndex === "undefined") continue;
	  	var color = (sortCol[0] == realIndex && sortCol[1] == 1)? "#9ECF9B": (sortCol[0] == realIndex && sortCol[1] == -1)  ? "#CFBC9B": "";
	  	headerStr += '<td onclick="javascript:setSortCol('+x+')" style="border:1px solid #999;font-size:12px;width:'+myRowsWidths[realIndex]+'px;background-color:'+color+';"><span class="odd-row" ><a style="color:#000; text-decoration:none;" href="javascript:moveHeader('+x+', -1);">&lt;</a>&nbsp;<a style="color:#000" href="javascript:removeHeader('+x+');">'+headers[realIndex]+'</a>&nbsp;<a style="color:#00C; text-decoration:none;" href="javascript:moveHeader('+x+', 1);">&gt;</a></span></td>';
	  }
	  headerStr += '</tr>';

		$('#rows_content').append(headerStr);
		//console.log(data);
		//console.log(data.length);
		var totals = {};
		totals["a"] = 0;
		totals["am"] = 0;
		totals["d"] = 0;
		totals["dm"] = 0;
		totals["money"] = 0;
		totals["fuel"] = 0;
		
		data = sortRows(data);
		for (var j = 0; j< data.length; j++)
		{
			myRows.push(data[j][0]);
			var rrr = data[j][0];
			_rowData[rrr] = [];
			_rowData[rrr] = data[j];

				style = (j % 2) ? 'odd-row' : 'even-row';

				$('#rows_content').append('<tr class="'+style+'" style="height:16px;"></tr>');
				slice = $('#rows_content tr').eq(j + 1)
				var counter = 0;


				var rowId = parseInt(data[j][0],10);
				var a = parseInt(data[j][7],10);
				var am = parseInt(data[j][8],10);
				var d = parseInt(data[j][9],10);
				var dm = parseInt(data[j][10],10);
				var money = parseInt(data[j][4],10);
				var fuel = parseInt(data[j][6],10);
				if(showTotals){
					totals["a"] += a;
					totals["am"] += am;
					totals["d"] += d;
					totals["dm"] += dm;
					totals["money"] += money;
					totals["fuel"] += fuel;
					
				}
				for (var i = 0; i< headers.length ; i++){
				 		var r = myRowsHeaderIdx[i];
				 		var header = headers[r]; //current header we are looking at?
				 		//console.log("header["+i+"] maps to idx ["+r+"]");
				 		style = (rowID()==data[j][0]) ? 'selected-col' : (counter++ % 2) ? 'odd-col' : 'even-col';


						if(typeof r === "undefined") continue;

						var cell = evilDF(data[j][r]);
						var cellStyle = "font-size:12px;overflow:visible !important; width:"+myRowsWidths[r]+"px;";

						/*
						 * CUSTOM HEADERS: add them in to this else/if after you've added them to the 'myRowsHeaderIdx', 'myRowsHeaders', 'myRowsWidths' above
						 */
						if(header === 'can buy'){
							if(showQuickBuyLinks){
								cell = "<a href='javascript:buyAttackers("+Math.floor(data[j][4]/20)+","+data[j][0]+");'>a</a>:" + Math.floor(data[j][4]/20) + "<br/><a href='javascript:buyDefenders("+Math.floor(data[j][4]/10)+","+data[j][0]+");'>d</a>:" + Math.floor(data[j][4]/10)+"";
							} else {
								cell = "a:" + Math.floor(data[j][4]/20) + "<br/>d:" + Math.floor(data[j][4]/10);
							}
						} else if(header === 'can defend'){
							var maxM = Math.floor(20 * (a * am + d*dm ) / (dm + 3));
							cell = evilDF(maxM);
							cellStyle += (money > maxM ? "color:red;":"")+"width:150px";
						} else if(header === '#'){ //row number
							cell = (j + 1);
							cellStyle += "width:25px";
						} else if(header === 'scan'){ //row number
							cell = "&nbsp;<a href='javascript:scanAroundRow("+rowId+",update_browse_data)'>"+rowId+"</a>";
							cellStyle += "width:25px";
						}
						slice.append('<td onclick="select_row_browse('+rowId+');" class="'+style+'" style="'+cellStyle+'">'+cell+'</td>');
				 }
		}
		$('#rows_content').append('<tr class="'+style+'" style="height:16px;"></tr>');
		$('#rows_content').append('<tr id="removed_idx" class="'+style+'" style="height:16px;"></tr>');
		$('#rows_content').append('<tr class="'+style+'" style="height:16px;"></tr>');
		$('#rows_content').append('<tr id="totals_slice" class="'+style+'" style="height:16px;"></tr>');
		slice = $('#removed_idx');
		for (var i = 0; i< myRowsHeaderIdxRemoved.length ; i++){
			if(typeof headers[myRowsHeaderIdxRemoved[i]] == "undefined") continue;
			slice.append("<td><a href='javascript:addHeader("+i+");'>+"+headers[myRowsHeaderIdxRemoved[i]]+"</a></td>");
		}

		slice = $('#totals_slice');
		slice.append("<a href='javascript:toggleTotals();>Totals</a>");

		if(showTotals){
			slice.append("attackers:&nbsp;"+totals.a+" attack_mult:&nbsp;"+totals.am+" defenders:&nbsp;"+totals.d+" defence_mult:&nbsp;"+totals.dm+" money:&nbsp;"+totals.money+" fuel:&nbsp;"+totals.fuel + " rows:&nbsp;"+data.length);
		}
		if(myRows.length > 0){
			var r = myRows.join(",");
			var saved = readCookie("myRows");
			if(saved == null || saved !== r){
				createCookie("myRows", r, 1000);
			}
		}
		if(!speedup) $(window).trigger('resize');

	}
}

function selectQuerySet(num){
	num |= 0;
	if($("#query_list_"+num).length > 0){
		$('#queries .query_list').each(function () {
			$(this).css('display', 'none')
		});
		$("#query_list_"+num).css('display', 'inline');
		currentQuerySet = num;
		if(num == 3 && safeTransfers) getMyRowsDropdown();
	}
	$("#fastRow").remove();
	$("input[name=custom_name]:eq(0)").after("<div id='fastRow'>&nbsp;&nbsp;<a href='javascript:fastRowBuild()'>Fast Build</a> - needs 800K + RC cost on THIS row.</div>");
}

function getCurrentRowData(targ){
/*
0 is row ID
4 is money
6 if fuel
7 is attackers
8 is atkMult
9 is defenders
10 is defenseMult
*/
	if(_currentRow == -1 || typeof _currentRow === "undefined" && newUpdates){
		_currentRow = parseInt($($(".selected-col")[0]).html(), 10);
		return parseInt($($(".selected-col")[targ]).html(), 10);
	} else {
		return getRowData(_currentRow, targ);
	}
}

function getCurrentRowId(){
	return current_row_id;
}

var firstRun=0;
function update_browse_data(data){
	myRowId = getCurrentRowId();
	// Edited by Brian
	// First, collect data that won't change in non crap references.

	// Step 1, calculate grey box misc modifiers
	var ATTACKER_COST = 20;
	var myATTACK_MULTIPLIER = getCurrentRowData(8);

	var adjustedAttackMultiplier = 0;
	if (myATTACK_MULTIPLIER > 2) {
		var adjustedAttackMultiplier = myATTACK_MULTIPLIER - 2;
	}
	adjustedAttackMultiplier = Math.floor(adjustedAttackMultiplier/3);

	var MONEY_HAUL = (adjustedAttackMultiplier+1)*10; //=INT(MAX(0,D$16-2)/3+1)*10 -- d16 is attack mult
	//alert("Money Haul: "+MONEY_HAUL);
	var FUEL_HAUL = MONEY_HAUL;
	var DEFENDER_LOSS = .25;
	var FUEL_COST_FACTOR = 1/Math.pow(2,adjustedAttackMultiplier); //=1/POWER(2,INT(MAX(0,D16-2)/3))
	var ATTACK_RANGE = FUEL_HAUL * Math.pow(2,adjustedAttackMultiplier); //range for which taking fuel is worthwhile
	//alert("Fcf: "+FUEL_COST_FACTOR);
	var myMONEY=getCurrentRowData(4);
	var myFUEL=getCurrentRowData(6);
	var myATTACKERS=getCurrentRowData(7);

	//

	var headers = row_format; //.concat(['Suggested_Attackers','Suggested_Attackers']);//data.shift();


	//If we don't do it this way, they keep being pushed on. Dunno why.

	//var newHeads = ['1stStrike_Money','1stStrike_Money'];
	//headers.push(newHeads);

	headers.splice(12,headers.length-12);
	headers.push(['Attack_with_Recd','Attack_with_Recd',1]);
	headers.push(['&Delta;_fuel','&Delta;_fuel',1]);
	headers.push(['&Delta;_money','&Delta;_money',1]);
	headers.push(['&Delta;_profit','&Delta;_profit',1]);
	headers.push(['&Delta;_atk','&Delta;_atk',1]);


	if(typeof data === "String" || typeof data === "string"){
		data = eval('(' + data + ')');
	}

	$('#browse_content').empty();
	if(data.no_fuel){
		$('#browse_query').html("<span style='color:red'>Row "+data.row_id+" must have at least 1 fuel to browse.</span>");
	}else if(data.outOfRange){
		$('#browse_query').html("<span style='color:red'>Browse target out of range.</span>");
	}else{
		$('#browse_query').html("SELECT * FROM rows WHERE row_id>="+data.start+" and row_id<"+(data.start+10)+";<br>"+
			('prev' in data ? "<a href='#' onClick='updateBrowse({\"row_id\":"+data.row_id+", \"start\":"+data.prev+"});return false'><< rows "+data.prev+" to "+(data.prev+9)+"</a>" : "") +
			" [cost 1 fuel - <a href='#' onClick='updateBrowse({\"row_id\":"+data.row_id+", \"start\":"+data.start+"});return false'>refresh</a>] "+
			(data.next ? "<a href='#' onClick='updateBrowse({\"row_id\":"+data.row_id+", \"start\":"+data.next+"});return false'>rows "+data.next+" to "+(data.next+9)+" >></a>" : "")
			);



		var out = '<tr class="odd-row"><th class="even-col"></th>';
		var style;



		var counter=0;
		for (var i = 0; i<headers.length; i++){ //>

			if ( isHiddenCols(i) == 0 ) {

				style = (counter++ % 2) ? 'odd-col' : 'even-col';
				out += '<th class="'+style+'"><a href="javascript:addHiddenCols('+i+')">'+String(headers[i][1]).replace("_","_<br />")+"</a></th>";
			}
		}
		out += "</tr>";




		for (var i = 0; i<data.rows.length; i++){


			style = (i % 2) ? 'odd' : 'even';
			var row = data.rows[i];
			no_attack = row['no_attack'];
			row_class = row['class'];
			can_delete = row['can_delete'];
			if(can_delete)
				row_class = "can-delete "+row_class;
			out += "<tr class='"+row_class+'-'+style+"'><td class='even-col' style='color:red'>"+
				(no_attack?"<span title='attacked within last 10 seconds'>*</span>":"")+"</td>";




			row = row['fields'];

			//Doing row attack calcs here
				/* Row Cols
				0 = row num
				3 = money_facs
				4 = money
				5 = fuel_facs
				6 = fuel
				7 = attackers
				8 = atk_mult
				9 = defenders
				10 = def_mult
				11 = row_creat
				*/

			var defRowId = parseInt(row[0],10);
			var defRowMoneyFacs = parseInt(row[3],10);
			var defRowMoney = parseInt(row[4],10);
			var defRowFuel = parseInt(row[6],10);
			var defRowAtkrs = parseInt(row[7],10);
			var defRowAtkMult = parseInt(row[8],10);
			var defRowDefrs = parseInt(row[9],10);
			var defRowDefMult = parseInt(row[10],10);


			var firstStrikeMoney = " ";
			var firstStrikeFuel = " ";
			var suggestedAtkrs = " ";
			var fuelUse = " ";
			var lostAttackers = " ";
			var deltaAttackers = " ";
			var deltaMoney = " ";
			var deltaFuel = " ";
			var deltaProfit = " ";
			var transMoney = " ";
			var transFuel = " ";
			var transAttackers = " ";

			var attackable = false;
			var stupid = false;
			var good = false;
			var atkDistance = Math.abs(myRowId - defRowId);
			var atk = " ";

			if ( defRowMoney > 0 ) { //Don't bother doing these calcs for empty or poor rows



				firstStrikeMoney = Math.floor( 	(defRowAtkrs*defRowAtkMult*1.1/myATTACK_MULTIPLIER)+ //Have to Overcome their attackers
									(defRowDefrs*defRowDefMult*1.1/myATTACK_MULTIPLIER)+ //Then defenders
									(defRowMoney/MONEY_HAUL));			      //Then take their stuff. Rule 1: Pillage, THEN BURN!

				firstStrikeFuel = Math.floor( 	(defRowAtkrs*defRowAtkMult*1.1/myATTACK_MULTIPLIER)+ //Have to Overcome their attackers
									(defRowDefrs*defRowDefMult*1.1/myATTACK_MULTIPLIER)+ //Then defenders
									(defRowFuel/FUEL_HAUL));			      	      //Then take their stuff. Rule 1: Pillage, THEN BURN!


				if ( atkDistance <= ATTACK_RANGE ) { //go for max fuel / money  if we're attacking within break-even range
					suggestedAtkrs = Math.min(myATTACKERS, Math.floor(myFUEL/(atkDistance*FUEL_COST_FACTOR)),Math.max(firstStrikeMoney, firstStrikeFuel));  //=MIN(D15,INT(D14/(ABS(O12-D12)*$I$16)),E18)
						//Deviated from the algo here since it's also important to capture fuel to keep the killing going.
				}
				else { //otherwise just take the money - going for max fuel is counterproductive
					suggestedAtkrs = Math.min(myATTACKERS, Math.floor(myFUEL/(atkDistance*FUEL_COST_FACTOR)),firstStrikeMoney);  //=MIN(D15,INT(D14/(ABS(O12-D12)*$I$16)),E18)
				}

				fuelUse = 0;
				lostAttackers = 0;
				deltaAttackers = 0;
				deltaMoney = 0;
				deltaFuel = 0;
				deltaProfit = 0;
				if (suggestedAtkrs >= 1){
					fuelUse = Math.floor(atkDistance * FUEL_COST_FACTOR * suggestedAtkrs);
					lostAttackers = 0 - (Math.floor(Math.min(suggestedAtkrs,(defRowAtkrs*defRowAtkMult*1.1/myATTACK_MULTIPLIER))) +
						                 Math.floor(Math.min(suggestedAtkrs,(defRowDefrs*defRowDefMult*1.1/myATTACK_MULTIPLIER))));
					if ( Math.abs(lostAttackers) >= suggestedAtkrs){
						lostAttackers = 0 - suggestedAtkrs;
						stupid = true;
					}
					deltaAttackers = lostAttackers;
					deltaMoney = Math.min(Math.floor(suggestedAtkrs + lostAttackers)*MONEY_HAUL,defRowMoney);
					deltaProfit = deltaMoney+lostAttackers*20;
					if(typeof deltaProfit == "undefined"){
						deltaProfit = "reload myrows";
					}
					var deltaFuel = Math.min(Math.floor(suggestedAtkrs + lostAttackers)*FUEL_HAUL,defRowFuel)-fuelUse;

				}

				var atkRange=  Math.min(myATTACK_MULTIPLIER-defRowAtkMult,myATTACK_MULTIPLIER-defRowDefMult);

				attackable = atkRange < 4;
				good = deltaProfit > 0 && deltaFuel > 0 && attackable;
				var blacklisted = false;
				if(blacklistRows.length > 0){
					for(var xx = 0; xx < blacklistRows.length; xx++){
						var rr = parseInt($.trim(blacklistRows[xx]), 10);
						var dd = parseInt(defRowId, 10);
						if(rr === dd) { blacklisted = true; break; }
					}
				}
				if (!stupid && attackable && (deltaProfit > 0 || deltaFuel + (deltaProfit*fuelRatio) > 0) ) {
					if(!blacklisted){
						var atk='<div class="queries"><span class="query"><span class="button">'+
						'<input name="submit" value="ATTACK" onclick="querySubmit(this);$(this).parent().parent().parent().hide()" type="button" class="clickme">'+
						'</span><span class="desc">'+
							'<input name="target" size="3" value="'+defRowId+'" type="hidden">'+
							'<input name="attackers" value="'+suggestedAtkrs+'" size="3" type="">'+
							'<input name="query" value="Attack" type="hidden">'+
							'<input name="row_id" value="'+myRowId+'" type="hidden">'+
						'</span></div>';
					} else {
						var atk="**BL**";
					}

				}

			}
			//End row attack calcs, begin display
			//Start row transfer calcs.
			if (defRowMoneyFacs > 0 && myFUEL > 0 && atkDistance > 0){
			transMoney = Math.max(Math.min(myMONEY,Math.floor(myFUEL/
			(atkDistance*FUEL_COST_FACTOR))*100),0);
			transAttackers = Math.max(Math.min(myATTACKERS,Math.floor(myFUEL/
			(atkDistance*FUEL_COST_FACTOR))),0);
			transFuel = Math.floor((myFUEL/(100+
			(atkDistance*FUEL_COST_FACTOR))*100));

}
			//End row transfer calcs.








			//Here's where we add our calculated fun stuff.
			/*
			headers.push(['1_Strike_Money','1_Strike_Money',1]);
			headers.push(['1_Strike_Fuel','1_Strike_Fuel',1]);
			headers.push(['Recd._Atks','Recd._Atks',1]);
			headers.push(['&Delta;_fuel','&Delta;_fuel',1]);
			headers.push(['&Delta;_money','&Delta;_money',1]);
			headers.push(['&Delta;_profit','&Delta;_profit',1]);
			headers.push(['&Delta;_atk','&Delta;_atk',1]);
			Attack button.
			headers.push(['Max_Money_Transfer','Max_Money_Transfer',1]);
			headers.push(['Max_Fuel_Transfer','Max_Fuel_Transfer',1]);
			headers.push(['Max_Attackers_Transfer','Max_Attackers_Transfer',1]);
			*/
			row.push(atk);
			row.push(firstStrikeMoney);
			row.push(firstStrikeFuel);
			row.push(suggestedAtkrs);
			row.push(deltaFuel);
			row.push(deltaMoney);
			row.push(deltaProfit);
			row.push(deltaAttackers);

			row.push(transMoney);
			row.push(transFuel);
			row.push(transAttackers);
			//row.push(defRowId);

			var counter = 0;

			for (var j=0; j<row.length; j++){
				var color='black';
				var sty="style='";
				var clazz = ""; //assign class to rows which might be of different colors.
				if (!attackable){
					sty +="text-decoration:line-through;";
					clazz+="row_noAttack ";
				}

				if (stupid){
					sty +="color:#770000;";
					clazz+="row_stupid ";
					var potentialXX = false;
					var survivorsXX = Math.floor((parseInt(firstStrikeMoney, 10) * parseInt(myATTACK_MULTIPLIER, 10)	- parseInt(defRowAtkrs, 10) * parseInt(defRowAtkMult, 10) - parseInt(defRowDefrs, 10) * parseInt(defRowDefMult, 10)) / parseInt(myATTACK_MULTIPLIER, 10));
					var lossXX = 	parseInt(firstStrikeMoney, 10) - survivorsXX;

					if (lossXX * 20 < defRowMoney){
						potentialXX = true;	
					}

					if(potentialXX && attackable){
						sty +="text-decoration:underline";	
					}
									
				}

				else if (good == 1){
					sty +="color:#007700;";
					clazz+="row_good ";
				}
				else if (deltaProfit > 0 ){
					sty +="color:#000077;";
					clazz+="row_goodDelta ";
				}
				else if (deltaFuel + (deltaProfit*fuelRatio) > 0){
					sty +="color:#777700;";
					clazz+="row_goodFuel ";
				}

				sty += "'";
				if ( isHiddenCols(j) == 0) {
				style = ((counter++ % 2) ? 'odd-col ' : 'even-col ') + clazz;		;
				out += "<td class='"+style+"' "+sty+">"+
					evilDF(row[j]) +
					"</td>";
			  	}
			}

			out += "</tr>";
		}
		$('#browse_content').html(out);
		$(":button")
			.click(function () {
				disableActionButtons();
			});

	}
	// updateRows(); // this is good to decrement fuel, but is it really necessary? if we want to, reimplement in JS without server hit
	if(!speedup) onResize();

}

function disableActionButtons(){
	$(":button").each( function() { this.disabled = true } );
	$(":button").fadeTo("250",".1");
	$(document).ready(function() {
		setTimeout('$(":button").fadeTo("250","1");$(":button").each( function() { this.disabled = false } );', 2700);
	});
}
var browse = function(){


	var links = $(".panel_header:nth-child(2)").find("a");
	$(links[2]).click();
}

function eraseCookie(name) {
	createCookie(name,"",-1);
}
function buyAttackers(num, id){
	$.post("/update/queries", {"attackers":num, "query": "BuyAttackers","row_id":id, "submit":"go"});
}
function buyDefenders(num, id){
	$.post("/update/queries", {"defenders":num, "query": "BuyDefenders","row_id":id, "submit":"go"});
}

var row_format = [

	[
		
				['row_id'],
		
				['row_id']
		
	],

	[
		
				['name'],
		
				['name'],
		
				['100px']
		
	],

	[
		
				['owner__name'],
		
				['owner'],
		
				['100px']
		
	],

	[
		
				['money_factories'],
		
				['money_factories']
		
	],

	[
		
				['money'],
		
				['money']
		
	],

	[
		
				['fuel_factories'],
		
				['fuel_factories']
		
	],

	[
		
				['fuel'],
		
				['fuel']
		
	],

	[
		
				['attackers'],
		
				['attackers']
		
	],

	[
		
				['attack_multiplier'],
		
				['attack_multiplier']
		
	],

	[
		
				['defenders'],
		
				['defenders']
		
	],

	[
		
				['defense_multiplier'],
		
				['defense_multiplier']
		
	],

	[
		
				['row_creators'],
		
				['row_creators']
		
	]

];
	
function update_rows(data)
{
	if (!data.length) return;
	$('#rows #no_rows').remove();
	method = data.shift();
	if (method == 'refresh') {
		$('#rows_content').empty();
		$('#rows_headers').empty();
		
		rowID(data.shift());
		headers = row_format;//data.shift();
		for (var i = 0; i<headers.length; i++)
		{
			header = headers[i];
			style = (i % 2) ? 'odd-row' : 'even-row';
			$('#rows_headers').append('<tr class="'+style+'">'+
								'<th><span class="odd-col">'+header[1]+'</span></th>'+
								'</tr>');
			$('#rows_content').append('<tr class="'+style+'"></tr>');
			slice = $('#rows_content tr').eq(i)	
			for (var j = 0; j<data.length; j++)
			{
				style = (rowID()==data[j][0]) ? 'selected-col' : (j % 2) ? 'odd-col' : 'even-col';
				slice.append('<td onclick="select_row('+data[j][0]+');" id="row_'+data[j][0]+'_'+headers[i]+'" class="'+style+'">'+data[j][i]+'</td>');
			}
		}
		$(window).trigger('resize');
		
	}
}

function select_row(id)
{
	updateRows(id);
	update_queries(id);
}

updateRowsTimeout = 0;
function updateRows(id){
	if(updateRowsTimeout)
		clearTimeout(updateRowsTimeout);
	if (typeof(id)=="undefined")
		id = rowID();
	if (id == -1)
		id = '';
	$.post('update/rows', {'selected_id':id}, update_rows, data='json');
}
function resizeRows()
{
	var headers_width = 0;
	$('#rows_headers span').each(function () {
		if ($(this).width() > headers_width)
			headers_width = $(this).width();
	});
	$('#rows_headers').width(headers_width);
	
		
	width = $('.rows').width();
	//console.log(width, $('#rows_headers').width());
	$('#rows_scroll').width(width-$('#rows_headers').width()-25);
	$('#rows_scroll tr').each(function(){ 
		$('#rows_headers tr').eq($('#rows_scroll tr').index(this)).children('th').height($(this).height());
	});
} 

	function addslashes( str ) {
		// http://kevin.vanzonneveld.net
		return str.replace('/(["\'\])/g', "\\$1").replace('/\0/g', "\\0");
	}
        
	function update_browse_data(data){
		$('#browse_content').empty();
		if(data.no_fuel){
			$('#browse_query').html("<span style='color:red'>Row "+data.row_id+" must have at least 1 fuel to browse.</span>");
		}else if(data.outOfRange){
			$('#browse_query').html("<span style='color:red'>Browse target out of range.</span>");
		}else{
			$('#browse_query').html("SELECT * FROM rows WHERE row_id>="+data.start+" and row_id<"+(data.start+10)+";<br>"+
				('prev' in data ? "<a href='#' onClick='updateBrowse({\"row_id\":"+data.row_id+", \"start\":"+data.prev+"});return false'><< rows "+data.prev+" to "+(data.prev+9)+"</a>" : "") +
				" [cost 1 fuel - <a href='#' onClick='updateBrowse({\"row_id\":"+data.row_id+", \"start\":"+data.start+"});return false'>refresh</a>] "+
				(data.next ? "<a href='#' onClick='updateBrowse({\"row_id\":"+data.row_id+", \"start\":"+data.next+"});return false'>rows "+data.next+" to "+(data.next+9)+" >></a>" : "")
				);
			var headers = row_format;//data.shift();
			var out = '<tr class="odd-row"><th class="even-col"></th>';
			var style;
			for (var i = 0; i<headers.length; i++){ //>
				style = (i % 2) ? 'odd-col' : 'even-col';
				out += '<th class="'+style+'">'+String(headers[i][1]).replace("_","_<br />")+"</th>";
			}
			out += "</tr>";
			for (var i = 0; i<data.rows.length; i++){
				style = (i % 2) ? 'odd' : 'even';
				var row = data.rows[i];
				no_attack = row['no_attack'];
				row_class = row['class'];
				can_delete = row['can_delete'];
				if(can_delete)
					row_class = "can-delete "+row_class;
				out += "<tr class='"+row_class+'-'+style+"'><td class='even-col' style='color:red'>"+
					(no_attack?"<span title='attacked within last 10 seconds'>*</span>":"")+"</td>";
					
				row = row['fields'];
				for (var j=0; j<row.length; j++){
					style = (j % 2) ? 'odd-col' : 'even-col';
					out += "<td class='"+style+"'>"+
						(headers[j][2] ? "<div style='width:"+headers[j][2]+";overflow:hidden;text-overflow:ellipses;' title='"+addslashes(row[j])+"'>"+row[j]+"</div>" : row[j]) + // truncate rows with width set
						"</td>";
				}
				out += "</tr>";
			}
			$('#browse_content').html(out);
		}
		// updateRows(); // this is good to decrement fuel, but is it really necessary? if we want to, reimplement in JS without server hit
		onResize();
	}

	// fields = {'row_id':row_id, 'start':start [optional]}
	function updateBrowse(fields){
		$.post('update/browse', fields, update_browse_data, data='json');
	}
	
var last_log = '';
var log_kind = 'personal';
var log_updating = 0;
//update log callback
function update_log(data)
{
	log_updating = 0;
	$('#query_log_content tr').each(function (){
		this.className = this.className.replace(/\bnew-/, '');
	});
	if (!data['timestamp']) return;
	$('#query_log_content #no_queries').remove();

	last_log = data['timestamp'];
	data = data['logs'];
	for (var i = 0; i<data.length; i++)
	{
		even = "even";
		if ($('#query_log_content tr').length % 2)
			even = "odd";
		var run_by = (data[i]['run_by']?"<div class='run_by'>run by "+data[i]['run_by']+":</div>":"");
		$('#query_log_content').prepend(
			'<tr class="'+data[i]['class']+even+'">'+
			'<td class="timestamp">'+data[i]['display_time']+'</td>'+
			'<td class="query">'+run_by+
			data[i]['query_text']+'</td>'+
			'<td class="execute_length">'+data[i]['execute_length']+'</td>'+
			'</tr>');
	}
	$('#query_log_content tr:gt(100)').remove(); //clear logs over 100
}

function update_queries_data(data)
{
	if (!data.length) return;
//	var selected = $('#queries_accordian li').index($('#queries_accordian .selected')) | 0;
	$('#queries').html(data);
	selectQuerySet(currentQuerySet);
	resizeQueries();
	$('#queries .help_link').each(function () {
		$(this).click(function (){
			display_help(this.id);
		})
	});
	setTimeout('updateLog()', 500); // stagger refreshes to help the server
	//updateRows() called in queries_generate.html
}
function display_help(id)
{
	$('#help_panel').empty().load('doc?q='+id+' .contentblock > ', callback=resize_help). // load all children of .contentblock into help div
	css('display', 'block');
	$help_panel = dd.elements.help_panel;
	var offset = $("#"+id).offset();
	var totalWidth = ($(window).width()-20-20-20);
	var totalHeight = ($(window).height()-20-20);
	$help_panel.resizeTo(totalWidth-offset.left, 0);
	$help_panel.moveTo(offset.left, totalHeight+100);
}
function resize_help()
{
	
	var totalWidth = ($(window).width()-20-20-20);
	var totalHeight = ($(window).height()-20-20-40);
	$help_panel = dd.elements.help_panel;
	
	var innerHeight = 30;
	$('#help_panel > ').each(function(){
		console.log(this);
		innerHeight += $(this).height();			
	}); 
	console.log('min', Math.min(innerHeight, totalHeight));
	$help_panel.resizeTo($help_panel.w, Math.min(innerHeight, totalHeight));
	$help_panel.moveTo($help_panel.x, Math.max(totalHeight-$help_panel.h, 20));
}
function hide_help()
{
	$('#help_panel').css('display', 'none');
}
function update_queries(row_id){
	$.post('update/queries', {'row_id': row_id}, update_queries_data);
}

function resizeQueries(selected){
/*	if(!selected)
		selected = $('#queries_accordian li').index($('#queries_accordian .selected')) | 0;
	$("#queries_accordian").accordion("destroy");
	$("#queries_accordian").accordion({
   	fillSpace: true,  
   	header: "div.header"
	});
	$("#queries_accordian").accordion("activate",selected);
	*/
}


function getInputsInRow(button){
	var inputs = $(button).parent().parent().find(':input').get();
	var fields = {};
	//fields.submit = 1;
	for (var i=0;i<inputs.length;i++){
		fields[inputs[i].name]=inputs[i].value;
	}
	return fields;
}

function querySubmit(button){
	$('#queries_response_string').html("...<br>");
	$.post('update/queries', getInputsInRow(button), update_queries_data);
}

currentQuerySet = 0;
function selectQuerySet(num){
	num |= 0;
	if($("#query_list_"+num).length > 0){
		$('#queries .query_list').each(function () {
											$(this).css('display', 'none')
										});
		$("#query_list_"+num).css('display', 'inline');
		currentQuerySet = num;
	}
}

$(function(){
	update_queries('');
});



/*
 All edits made are in the public domain.
 Changelog
 0.1
 BBS: Initial draft made.
 0.1-small
 BBS: UI fork for smallUI
 0.2-small
 BA: I also changed blue results to green, and black to blue
 0.3-small
 BA: Bug stomping with inital comments
 0.4-small
 BBS: Changed color coding
 0.5
 BBS: Dropped redundant rowID
 BBS: Added "Max able to transfer to this row" lines
 BBS: Broke out profit from money gained
 BBS: Fixed script for multiple runs
 BBS: Fixed logic bug in loot calculations
 BBS: Moved hidden rows to cookies. Made hiding much cleaner.
 RECOMMENDATION TO DEVS: Take my bloody code -- this should be in the game.
 0.6
 BBS: Fixed Algo for fuel use
 BBS: Shortened Auto Attack button. Moved it forward.
 
 0.7
 MK: bunch of UI enhancements
 MK: removed stupid functions, all DOM manipulation should be done in jQuery, its already here!
 MK: removed alerts, added a messanging div, changed message text to make more sense from user's point of view
 MK: removing of columns updates scanning UI automagically
 MK: switching between rows updates scanning UI automagically
 MK: changed bookmarklet URL to never cache the bookmarklet, good for devs
 MK: added a totals column that eventually shows up, give it 3-4 refreshes
 0.8
 BBS: Fixed Fuel Transfer Bug
 BBS: Shortened Attack again
 BBS: Revised Green conditions (Now wants positive delta profit)
 BBS: Removed crossout cap
 0.8.1
 BBS: Fixed typo
 0.8.2
 MK: give rows different classes as well as different colors, useful for selecting them in the future.
 0.9
 BBS: Reworking suggested attackers to go for max proft/fuel if possible.
 BBS: Action button 2 second fading working.
 BR: Action button fading extended to 3 seconds
 0.9.1
 TZ: Recalculated transfer costs for Oct 7 transfer cost reduction
 TZ: Added floor function to fuel calculations to prevent decimal profit amounts
 BR: Slightly longer delay to action button fading
 0.9.2
 MK: added links for quickly buying attackers and defenders. this may be bad
 1.0
 MK: added a bigger and better options panel, and a framework for adding true/false options to it. anything can now be optional.
 turned off the auto-buy links by default
 1.1
 TZ: Fixed Blue condition to require positive deltaProfit instead of deltaMoney
 this should make negative fuel / negative profit rows Black again instead of Blue
 TZ: Added Yellow condition for  rows with positive fuel / negative profit
 TZ: Changed Attack button conditions to require positive fuel or profit so it doesn't show on Black rows
 TZ: Changed suggested attackers calculation to only go for money if the target is outside fuel break-even range
 1.1.1
 TZ: Tweaked Yellow condition to require fuel gain > profit loss
 1.1.2
 TZ: Added user option for Yellow condition fuel ratio
 1.1.3
 MK: options values are now saved in cookies
 1.2
 MK: added option that makes it so you can only transfer to your own rows.
 Devs: i am now saving own rows in cookie, which should hopefully be updated if user rows change (kinda hard to test this).
 this makes getting own rows much more reliable, after they are in the cookie. to get array of rows use: getMyRows()
 1.2.1
 MK: fixed safe transfer dropdown bug
 
 1.3
 MK: added optional number formatting for browse rows
 added displaying max money a row can 'safely' hold
 added option to turn off displaying extra money info, turning this off may speed up the UI
 1.3.1
 MK: bug fix
 1.4
 MK: blacklist of rows that wont have an attack button
 added an option to disable many more auto updates then the game allows to disable, should allow to speed some stuff up. does not disable bookmarklet stuffs
 1.4.1
 MK: silly little version update message.
 1.5
 MK: when safe transfers are enabled, the fuel, attackers, and money is auto filled into the correct field, in the max amount that can be transfered.
 1.5.1
 MK: chat tab added, has a filtered view into the personal tab, only showing chats.
 1.5.2
 MK: the row totals now displays net worth of all your stuff. fuel is valued same as money.
 1.5.3
 MK: row totals displayed in seperate panel
 1.5.4
 MK: updated how we query for row stats - this is used everywhere in the game. before this update we pulled this info out of the DOM, which is REALLY
 slow, expecially since we update the DOM from the JSON. Now we intercept the row stats as they come in, and pull data from javascript arrays, which
 should be much much faster
 2.0.0
 MK: rewrote my rows ui from scratch. rows display the same way 'browse rows' are displayed. you can sort the columns any way you want and remove/add individual
 columns. adding new columns in the future will be easier, and when a column is removed, its logic does not get executed.
 moved totals back into the rows ui.
 2.1.0
 MK: bug fixes
 added sorting on 'my rows'. click each column header to sort. click 2 times to change sort direction. stupid colors show which direction it is sorted.
 2.1.1
 MK: better colors, made everything smaller, resized some stuff to utilize the space better
 2.2
 MK: added bauernakke's attack potential patch. see: http://code.google.com/p/mysqlgame-ui-update/issues/detail?id=3
 2.3
 MK: added "fast row build" in the 'Rows' menu. To use: enter row id, and name, and click "Fast Build". the current row needs to have 800,000 + cost of row creator, or 
 a row creator. Wait about 45 seconds. Your new row will be MF13, FF13, AM1, DM3, DEF:61000. defends are bought first, then everything else.
 2.4
 MK: added a quick scan link on the rows panel. click to scan to selected row. also, as annoying as it may be, all cookied settings are reset when version changes. this is 
 needed because new features may become disabled forever if we dont do this.
 2.5
 MK: ghetto transfer all option. 
 need to run it 2 times, once for money, once for fuel. may fix this in the future. 
 2.5.1
 PV: show global change in profit, and change in fuel per session
 2.5.4
 OM: removed tracking backdoors (statcounter; r71 by petvirus2)
 2.5.5
 OM: changed default for formatNumbers to false ; get rid of <font> tags ; minor cleanups
 2.6
 MK: added link to better shard stats.
 2.7
 MK: added a bot
 
 Contributors:
 BBS: Brian Ballsun-Stanton
 BA: Brian Ackermann
 MK: Mikhail Koryak
 BR: Ben Robeson
 TZ: Talha Zaman
 OM: Olivier MenguÃƒÂ©
 PV: paul vander (petvirus2)
 
 Instructions for use:
 1) create a new bookmark.
 2) name it (mysqlgame bookmarklet)
 3) set the location  field equal to javascript:var%20m=document.createElement('script');m.setAttribute('src','http://mysqlgame-ui-update.googlecode.com/svn/trunk/BrianUiUpdate.js');document.body.appendChild(m);(function(){})();void(m);
 
 
 UI Elements:
 Strikethrough on browsing indicates not attackable
 Red lines indicate projected loss of all attacking soldiers
 Black lines mean negative fuel and money profit
 Blue lines mean negative fuel but positive money profit
 Yellow lines mean positive fuel but negative money profit
 Green lines mean positive fuel and positive money profit
 */var VERSION = "2.7";
var WHATSNEW = "added farm bot";
var myRowId = getCurrentRowId();
var rows = [];
var myRows = [];
var _rowData = {};
var _currentRow = -1;
var panelShown = false;
var showQuickBuyLinks = false;
var showTotals = true;
var showExtraMoneyInfo = true;
var fuelRatio = 1;
var safeTransfers = true;
var formatNumbers = false;
var blacklistRows = [];
var speedup = false;
var newUpdates = true;
var cost = {row: function(num) {
        return(Math.pow(1.5, num - 1) * 160000) - 160000
    }, ad: function(num) {
        return(Math.pow(2, num + 1) * 125) - 500
    }, ff: function(num) {
        return(Math.pow(2, num + 1) * 7.5) - 30
    }, mf: function(num) {
        return(Math.pow(2, num + 1) * 10) - 40
    }, a: function(num) {
        return num * 20
    }, d: function(num) {
        return num * 10
    }, m: function(num) {
        return num
    }, f: function(num) {
        return num
    }};
var HIDDEN_COLS = [];
if (readCookie('hiddenCols') != null) {
    var HIDDEN_COLS = readCookie('hiddenCols').split(',');
    setInfo("Hidden Columns: " + HIDDEN_COLS);
}
var sc_project = 4205332;
var sc_invisible = 1;
var sc_partition = 48;
var sc_click_stat = 1;
var sc_security = "cc7c68d3";
var df = 0;
var dm = 0;
var myRowsHeaders = ['id', 'name', 'owner', '#MF', 'money', '#FF', 'fuel', '#Atk', '*AM', '#Def', '*DM', '#RC', 'can buy', 'can defend', '#', 'scan'];
var myRowsHeaderIdx = [14, 0, 15, 1, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13];
var myRowsWidths = [40, 100, 80, 45, 80, 50, 80, 80, 45, 100, 45, 45, 80, 80, 25, 55];
var myRowsHeaderIdxRemoved = [];
$("#dashboard_header").html($("#dashboard_header").html() + "<br/>UI Update. " + getVer() + " - " + '<a href="javascript:togglePanel();">Toggle Bookmarklet Options</a>&nbsp;&nbsp;' + '<a style="padding-left:10px" href="javascript:transferAll();">Transfer all</a> &Delta;f:<span id="df"></span> &Delta;p:<span id="dm"></span> <a href="http://saldane.com/~koryakm/stats.pl?shard=' + getShard() + '" target="_blank">shard stats</a><br/>');
$(".dashboard").before('<div  style="position:absolute;top:20px;left:40px;color:#F00;" id="info"></div>' + '');
$(".dashboard").before('<div id="panel" style="position: absolute; width: 600px; height: 300px; top: 20px; border:1px solid #000; left: 20px; z-index: 999; background-color:#FFF; cursor: auto;">').before('<div id="panel2" style="position: absolute; width: 600px; height: 300px; top: 320px; border:1px solid #000; left: 20px; z-index: 999; background-color:#FFF; cursor: auto;">');
$("#panel, #panel2").hide();
scanAroundRow(getCurrentRowId(), update_browse_data);
$("input[name=custom_name]:eq(0)").after("&nbsp;&nbsp;<a href='javascript:fastRowBuild()'>Fast Build</a> - needs ~1M cash on THIS row. ");
$("#personal_link").after(' | <a id="chat_link" onclick="chat_log();" style="color: black;" href="#">Chat</a>');
row_format[7][1] = row_format[7][2] = '#_Atk';
row_format[8][1] = row_format[8][2] = '*_Atk';
row_format[9][1] = row_format[9][2] = '#_Def';
row_format[10][1] = row_format[10][2] = '*_Def';
row_format[3][1] = row_format[3][2] = '#MF';
row_format[5][1] = row_format[5][2] = '#FF';
row_format[4][1] = row_format[4][2] = 'money';
row_format[11][1] = row_format[11][2] = '#RC'
function getVer() {
    var ver = readCookie("version");
    var st;
    if (ver == null || ver !== VERSION) {
        st = "<span style='color: red'>NEW version " + VERSION + " : " + WHATSNEW + "</span>";
        createCookie("version", VERSION, 1000);
    } else {
        st = "version " + VERSION;
        initOptionsOnLoad();
    }
    st += " (<a target='_new' href='http://code.google.com/p/mysqlgame-ui-update/source/list?path=/trunk/BrianUiUpdate.js'>changes</a> <a target='_new' href='http://groups.google.com/group/mysqlgame/browse_thread/thread/d78281c55137ca6f'>discuss</a> <a target='_new' href='http://code.google.com/p/mysqlgame-ui-update/issues/list'>issues</a>)";
    return st;
}
function getShard() {
    return $("#dashboard_header span").text().split(" ")[1];
}
var fastRowBuild_DONE = true;
function fastRowBuild() {
    if (!fastRowBuild_DONE) {
        alert("not done yet. wait until the last build is finished");
        return;
    }
    fastRowBuild_DONE = false;
    var rowNum = $("input[name=custom_row_id]:eq(0)").val();
    var rowName = $("input[name=custom_name]:eq(0)").val();
    var myRow = current_row_id;
    var myCash = getCurrentRowData(4);
    myCash = myCash > 800000 ? 800000 : myCash;
    var calls = [];
    calls.push(function() {
        $.post("/update/queries", {row_id: myRow, "row_creators": 1, "query": "RowCreator", "submit": "go"});
        $("#fastRow").append("1/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {row_id: myRow, "custom_name": rowName, "custom_row_id": rowNum, "query": "CreateRow", "submit": "go"});
        $("#fastRow").append("2/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {"": myRow, "row_id": myRow, "target": rowNum, "query": "TransferMoney", "submit": "go", "amount": myCash});
        $("#fastRow").append("3/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {row_id: rowNum, "defenders": 61000, "query": "BuyDefenders", "submit": "go"});
        $("#fastRow").append("4/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {row_id: rowNum, "money_factories": 10, "query": "MoneyFactory", "submit": "go"});
        $("#fastRow").append("5/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {row_id: rowNum, "fuel_factories": 10, "query": "FuelFactory", "submit": "go"});
        $("#fastRow").append("6/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {row_id: rowNum, "defense_multiplier": 2, "query": "DefenseMultiplier", "submit": "go"});
        $("#fastRow").append("7/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {row_id: rowNum, "money_factories": 2, "query": "MoneyFactory", "submit": "go"});
        $("#fastRow").append("8/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {row_id: rowNum, "fuel_factories": 2, "query": "FuelFactory", "submit": "go"});
        $("#fastRow").append("9/10 ");
    });
    calls.push(function() {
        $.post("/update/queries", {row_id: rowNum, "defenders": 61000, "query": "BuyDefenders", "submit": "go"});
        $("#fastRow").append("DONE");
        fastRowBuild_DONE = true;
    });
    var sec = 4;
    for (var i = 0; i < calls.length; i++) {
        var fn = calls[i];
        setTimeout(fn, sec * (i + 1) * 1000 + 250);
    }
}
function transferAll() {
    var rows = getMyRows();
    var target = prompt("row to transfer ALL ROWS fuel/money to?", "");
    var rows = prompt("Rows doing the sending are", rows.join(" ")).split(" ");
    var sec = 2;
    var calls = [];
    var j = 0;
    var arr = [];
    var totalM, totalF;
    var count = 1;
    for (var i = 0; i < rows.length; i++) {
        var stuff = getMaxTransferAttackerAndFuelAndMoney(rows[i], target);
        var maxMoney = stuff[1];
        arr[i] = maxMoney - 100;
        totalM += maxMoney;
        if (maxMoney > 500) {
            setTimeout(function() {
                $.post("/update/queries", {"": rows[j], "row_id": rows[j], "target": target, "query": "TransferMoney", "submit": "go", "amount": arr[j]});
                j++;
                updateRows();
            }, sec * (count) * 1000 + 250);
            console.log("m:" + sec * (count));
            count++;
        }
    }
    setTimeout(function() {
        var k = 0;
        var arrk = [];
        for (var i = 0; i < rows.length; i++) {
            var stuff = getMaxTransferAttackerAndFuelAndMoney(rows[i], target);
            var maxF = stuff[2];
            arrk[i] = maxF - 100;
            totalF += maxF;
            if (maxF > 1000) {
                setTimeout(function() {
                    $.post("/update/queries", {"": rows[k], "row_id": rows[k], "target": target, "query": "TransferFuel", "submit": "go", "amount": arrk[k]});
                    k++;
                    updateRows();
                }, sec * (count) * 1000 + 250);
                console.log("m:" + sec * (count));
                count++;
            }
        }
    }, (count + 1) * sec);
}
function eraseHiddenCols() {
    eraseCookie('hiddenCols');
    HIDDEN_COLS = [];
    setInfo('all hidden columns shown');
    browse();
}
function select_row_browse(arg) {
    _currentRow = arg;
    if (arg !== "TOTALS") {
        browse();
        select_row(arg);
    }
}
function togglePanel() {
    panelShown = !panelShown;
    if (panelShown) {
        $("#panel").show();
    } else {
        $("#panel").hide();
        $("#panel2").hide();
        showTotalsColumn = false;
    }
    updatePanel();
}
function updatePanel() {
    $("#panel").html('<div style="border-bottom:2px #000 solid;">BOOKMARKLET OPTIONS &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a style="padding-left:10px" href="javascript:togglePanel();">[close]</a></div>' + 'New options are added to the bottom of the list.. <br/>' + '<a style="padding-left:10px" href="javascript:eraseHiddenCols();">Show all hidden columns</a><br/>' + '<a style="padding-left:10px" href="javascript:toggleQuickBuyLinks();">Display quick-buy links - ' + getOptionBoolean(showQuickBuyLinks) + '</a><br/>' + '<a style="padding-left:10px" href="javascript:toggleTotals();">calculate totals - ' + getOptionBoolean(showTotals) + '</a><br/>' + '<a style="padding-left:10px" href="javascript:cycleFuelRatio();">Attack for fuel if ratio is at least - ' + getOptionNumber(fuelRatio) + '</a><br/>' + '<a style="padding-left:10px" href="javascript:toggleSafeTransfers();">Enable safe transfers - ' + getOptionBoolean(safeTransfers) + '</a><br/>' + '<a style="padding-left:10px" href="javascript:toggleFormatNumbers();">Enable number formatting - ' + getOptionBoolean(formatNumbers) + '</a><br/>' + '<a style="padding-left:10px" href="javascript:toggleExtraMoneyInfo();">Show other money info - ' + getOptionBoolean(showExtraMoneyInfo) + '</a><br/>' + '<span style="padding-left:10px">Attack blacklist: <input style="border: #000 1px solid;" size="77" id="blacklistRows" onchange="saveBlacklist(this)" value=""/></span><br/>' + '<a style="padding-left:10px" href="javascript:toggleSpeedup();">disable all auto refreshes/logs, to speed things up - ' + getOptionBoolean(speedup) + '</a><br/>' + '<a style="padding-left:10px" href="javascript:getRowTotalsAlert();">get better row totals</a><br/>' + '<a style="padding-left:10px" onclick="javascript:df=0;dm=0; return false;" href="#">reset loot counters</a><br/>' + '');
    $("#blacklistRows").val(blacklistRows.join(","));
    $("#blacklistRows").constrainInput({allowedCharsRegex: "\\d+|,"});
}
function initOptionsOnLoad() {
    var setup = function(varName, varValue) {
        var variable = readCookie(varName);
        if (variable === null) {
            createCookie(varName, varValue, 1000);
            variable = varValue;
        }
        return variable;
    };
    var setupBoolean = function(varName, varValue) {
        varValue = (setup(varName, varValue) === "true");
        eval(varName + "=" + varValue);
    }
    setupBoolean('showQuickBuyLinks', false);
    setupBoolean('showTotals', true);
    setupBoolean('safeTransfers', true);
    setupBoolean('formatNumbers', false);
    setupBoolean('speedup', false);
    setupBoolean('showExtraMoneyInfo', true);
    blacklistRows = setup('blacklistRows', '').split(",");
    myRowsHeaderIdx = setup('myRowsHeaderIdx', myRowsHeaderIdx.join(",")).split(",");
    myRowsHeaderIdxRemoved = setup('myRowsHeaderIdxRemoved', '').split(",");
    fuelRatio = parseInt(setup('fuelRatio', 1), 10);
}
function saveBlacklist(el) {
    var blr = $(el).val();
    createCookie('blacklistRows', blr, 1000);
    blacklistRows = blr.split(",");
}
function getOptionBoolean(opt) {
    return opt ? "[x]" : "[ ]";
}
function getOptionNumber(opt) {
    return"[" + opt + "]";
}
function toggleBoolean(varName, varValue) {
    varValue = !varValue;
    eval(varName + "=" + varValue);
    updatePanel();
    createCookie(varName, varValue, 1000);
}
function toggleNewUpdates() {
    toggleBoolean('newUpdates', newUpdates);
}
function toggleQuickBuyLinks() {
    toggleBoolean('showQuickBuyLinks', showQuickBuyLinks);
}
function toggleFormatNumbers() {
    toggleBoolean('formatNumbers', formatNumbers);
}
function toggleExtraMoneyInfo() {
    toggleBoolean('showExtraMoneyInfo', showExtraMoneyInfo);
}
function toggleTotals() {
    toggleBoolean('showTotals', showTotals);
}
function toggleSafeTransfers() {
    toggleBoolean('safeTransfers', safeTransfers);
}
function toggleSpeedup() {
    toggleBoolean('speedup', speedup);
}
function cycleFuelRatio() {
    fuelRatio = (fuelRatio + 1) % 6;
    updatePanel();
    createCookie('fuelRatio', fuelRatio, 1000);
}
function getMyRows() {
    return readCookie("myRows").split(",");
}
function getMyRowsDropdown() {
    var inp = $("#query_list_3").find("input[name=target]");
    var ammt = $("#query_list_3").find("input[name=amount]");
    var html = "<select>";
    var rr = getMyRows();
    if (rr === null)
        rr = myRows;
    for (var i = 0; i < rr.length; i++) {
        html += '<option value ="' + rr[i] + '">' + rr[i] + '</option>';
    }
    html += "</select>";
    inp.each(function(i, n) {
        $(this).siblings("select").remove();
        $(this).after(html);
        $(this).hide();
        $(this).val(rr[0]);
        var trans = getMaxTransferAttackerAndFuelAndMoney(getCurrentRowId(), rr[0]);
        switch (i) {
            case 0:
                $(ammt[0]).val(trans[0]);
                break;
            case 1:
                $(ammt[1]).val(trans[1]);
                break;
            case 2:
                $(ammt[2]).val(trans[2]);
                break;
        }
        var that = $(this);
        $(this).siblings("select").change(function() {
            var otherRow = $(this).val();
            that.val(otherRow);
            var trans = getMaxTransferAttackerAndFuelAndMoney(getCurrentRowId(), otherRow);
            switch (i) {
                case 0:
                    $(ammt[0]).val(trans[0]);
                    break;
                case 1:
                    $(ammt[1]).val(trans[1]);
                    break;
                case 2:
                    $(ammt[2]).val(trans[2]);
                    break;
                }
        });
    });
}
function getMaxTransferAttackerAndFuelAndMoney(myRow, otherRow) {
    var currRow = getRowData(myRow, 0);
    var currA = getRowData(myRow, 7);
    var currAM = getRowData(myRow, 8);
    var currF = getRowData(myRow, 6);
    var currM = getRowData(myRow, 4);
    var distance = Math.abs(currRow - otherRow);
    if (currAM > 2) {
        currAM = currAM - 2;
    }
    currAM = Math.floor(currAM / 3);
    var fuelCostFactor = 1 / Math.pow(2, currAM);
    var transAttackers = Math.max(Math.min(currA, Math.floor(currF / (distance * fuelCostFactor))), 0);
    var transFuel = Math.floor((currF / (100 + (distance * fuelCostFactor)) * 100));
    var transMoney = Math.max(Math.min(currM, Math.floor(currF / (distance * fuelCostFactor)) * 100), 0);
    return[transAttackers, transMoney, transFuel]
}
function evilDF(num) {
    if (!formatNumbers)
        return num;
    num = num + "";
    return num.replace(/(\d{1,3})?(\d{3})?(\d{3})?(\d{3})?(\d{3})?$/, "$1,$2,$3,$4,$5").replace(/,+$/, "");
}
function scanAroundRow(row, callback) {
    var start = row - (row % 10);
    if (!speedup)
        $.post("/update/browse", {row_id: row, "start": start, "submit": "go"}, callback);
}
function isHiddenCols(j) {
    for (var i = 0; i < HIDDEN_COLS.length; i++)
        if (HIDDEN_COLS[i] == j)
            return 1;
    return 0;
}
function getRowData(row, idx) {
    if (typeof _rowData !== "undefined" && typeof _rowData[row] !== "undefined" && newUpdates) {
        return parseInt(_rowData[row][idx], 10);
    } else {
        return parseInt($($("td[onClick^=select_row_browse(" + row + ")]")[idx]).html(), 10);
    }
}
function setInfo(st) {
    $("#info").html(st);
}
function addHiddenCols(i) {
    if (isHiddenCols(i) == 0)
        HIDDEN_COLS.push(i);
    setInfo("Hidden Column: " + i + ". removed.");
    createCookie("hiddenCols", HIDDEN_COLS.toString());
    browse();
}
function getRowTotalsAlert() {
    var totalA = 0;
    var totalD = 0;
    var totalM = 0;
    var totalF = 0;
    var totalMF = 0;
    var totalFF = 0;
    var totalRC = 0;
    var totalCost = 0;
    var totalRC = myRows.length;
    for (var poop = 0; poop < myRows.length; poop++) {
        var rrow = myRows[poop];
        totalA += getRowData(rrow, 7);
        totalD += getRowData(rrow, 9);
        totalM += getRowData(rrow, 4);
        totalF += getRowData(rrow, 6);
        totalMF += getRowData(rrow, 3);
        totalFF += getRowData(rrow, 5);
        totalRC += getRowData(rrow, 11);
        totalCost += cost.ad(getRowData(rrow, 8)) + cost.ad(getRowData(rrow, 10)) + cost.ff(getRowData(rrow, 5)) + cost.mf(getRowData(rrow, 3)) + cost.a(getRowData(rrow, 7)) + cost.d(getRowData(rrow, 9)) + getRowData(rrow, 4) + getRowData(rrow, 6);
    }
    totalCost += cost.row(totalRC);
    totalCost = Math.floor(totalCost);
    var html = "attackers:" + evilDF(totalA) + "\n" + "defenders:" + evilDF(totalD) + "\n" + "money:" + evilDF(totalM) + "\n" + "fuel:" + evilDF(totalF) + "\n" + "money factories:" + evilDF(totalMF) + "\n" + "fuel factories:" + evilDF(totalFF) + "\n" + "rows:" + myRows.length + "\n" + "net worth:" + evilDF(totalCost) + "\n";
    if (totalCost < 0) {
        html += "\n\nit seems like the calculations are wrong, you need to refresh the rows panel a few times, and try again";
    }
    alert(html);
}
updateRows();
function moveHeader(index, dir) {
    var newIndex = index + dir;
    if ((newIndex < 0) || (newIndex >= myRowsHeaderIdx.length))
        return;
    var old = myRowsHeaderIdx[index];
    var neww = myRowsHeaderIdx[newIndex];
    myRowsHeaderIdx[index] = neww;
    myRowsHeaderIdx[newIndex] = old;
    updateRows();
    createCookie("myRowsHeaderIdx", myRowsHeaderIdx.join(","), 1000);
}
function removeHeader(index) {
    myRowsHeaderIdxRemoved.push(myRowsHeaderIdx[index]);
    myRowsHeaderIdx.splice(index, 1);
    updateRows();
    createCookie("myRowsHeaderIdx", myRowsHeaderIdx.join(","), 1000);
    createCookie("myRowsHeaderIdxRemoved", myRowsHeaderIdxRemoved.join(","), 1000);
}
function addHeader(i) {
    myRowsHeaderIdx.push(myRowsHeaderIdxRemoved[i]);
    myRowsHeaderIdxRemoved.splice(i, 1);
    createCookie("myRowsHeaderIdx", myRowsHeaderIdx.join(","), 1000);
    createCookie("myRowsHeaderIdxRemoved", myRowsHeaderIdxRemoved.join(","), 1000);
    updateRows();
}
$("#rows_scroll").css("overflow-x", "visible");
$("#rows_scroll").css("width", "745px");
$('#rows_content').css("width", "100%")
var sortCol = [0, 1];
function sortRows(data) {
    sortAsc = (sortCol[1] < 0);
    sortColumn = sortCol[0];
    var sortUp = function(a, b) {
        return a[sortCol[0]] - b[sortCol[0]];
    };
    var sortDown = function(a, b) {
        return b[sortCol[0]] - a[sortCol[0]];
    };
    var sortFunc = sortAsc ? sortUp : sortDown;
    data.sort(sortFunc);
    return data;
}
function setSortCol(col) {
    col = myRowsHeaderIdx[col]
    if (sortCol[0] == col) {
        sortCol[1] *= -1;
    } else {
        sortCol[0] = col;
        sortCol[1] = 1;
    }
    updateRows();
}
var totalsRow = [];
function update_rows(data)
{
    myRows = [];
    if (!data.length)
        return;
    $('#rows #no_rows').remove();
    method = data.shift();
    if (method == 'refresh') {
        $('#rows_content').empty();
        $('#rows_headers').empty();
        rowID(data.shift());
        headers = myRowsHeaders;
        headerStr = '<tr class="odd-col" style="background-color:#40FF40;">';
        for (x = 0; x < headers.length; x++) {
            var realIndex = myRowsHeaderIdx[x];
            if (typeof realIndex === "undefined")
                continue;
            var color = (sortCol[0] == realIndex && sortCol[1] == 1) ? "#9ECF9B" : (sortCol[0] == realIndex && sortCol[1] == -1) ? "#CFBC9B" : "";
            headerStr += '<td onclick="javascript:setSortCol(' + x + ')" style="border:1px solid #999;font-size:12px;width:' + myRowsWidths[realIndex] + 'px;background-color:' + color + ';"><span class="odd-row" ><a style="color:#000; text-decoration:none;" href="javascript:moveHeader(' + x + ', -1);">&lt;</a>&nbsp;<a style="color:#000" href="javascript:removeHeader(' + x + ');">' + headers[realIndex] + '</a>&nbsp;<a style="color:#00C; text-decoration:none;" href="javascript:moveHeader(' + x + ', 1);">&gt;</a></span></td>';
        }
        headerStr += '</tr>';
        $('#rows_content').append(headerStr);
        var totals = {};
        totals["a"] = 0;
        totals["am"] = 0;
        totals["d"] = 0;
        totals["dm"] = 0;
        totals["money"] = 0;
        totals["fuel"] = 0;
        data = sortRows(data);
        for (var j = 0; j < data.length; j++)
        {
            myRows.push(data[j][0]);
            var rrr = data[j][0];
            _rowData[rrr] = [];
            _rowData[rrr] = data[j];
            style = (j % 2) ? 'odd-row' : 'even-row';
            $('#rows_content').append('<tr class="' + style + '" style="height:16px;"></tr>');
            slice = $('#rows_content tr').eq(j + 1)
            var counter = 0;
            var rowId = parseInt(data[j][0], 10);
            var a = parseInt(data[j][7], 10);
            var am = parseInt(data[j][8], 10);
            var d = parseInt(data[j][9], 10);
            var dm = parseInt(data[j][10], 10);
            var money = parseInt(data[j][4], 10);
            var fuel = parseInt(data[j][6], 10);
            if (showTotals) {
                totals["a"] += a;
                totals["am"] += am;
                totals["d"] += d;
                totals["dm"] += dm;
                totals["money"] += money;
                totals["fuel"] += fuel;
            }
            for (var i = 0; i < headers.length; i++) {
                var r = myRowsHeaderIdx[i];
                var header = headers[r];
                style = (rowID() == data[j][0]) ? 'selected-col' : (counter++ % 2) ? 'odd-col' : 'even-col';
                if (typeof r === "undefined")
                    continue;
                var cell = evilDF(data[j][r]);
                var cellStyle = "font-size:12px;overflow:visible !important; width:" + myRowsWidths[r] + "px;";
                if (header === 'can buy') {
                    if (showQuickBuyLinks) {
                        cell = "<a href='javascript:buyAttackers(" + Math.floor(data[j][4] / 20) + "," + data[j][0] + ");'>a</a>:" + Math.floor(data[j][4] / 20) + "<br/><a href='javascript:buyDefenders(" + Math.floor(data[j][4] / 10) + "," + data[j][0] + ");'>d</a>:" + Math.floor(data[j][4] / 10) + "";
                    } else {
                        cell = "a:" + Math.floor(data[j][4] / 20) + "<br/>d:" + Math.floor(data[j][4] / 10);
                    }
                } else if (header === 'can defend') {
                    var maxM = Math.floor(20 * (a * am + d * dm) / (dm + 3));
                    cell = evilDF(maxM);
                    cellStyle += (money > maxM ? "color:red;" : "") + "width:150px";
                } else if (header === '#') {
                    cell = (j + 1);
                    cellStyle += "width:25px";
                } else if (header === 'scan') {
                    cell = "&nbsp;<a href='javascript:scanAroundRow(" + rowId + ",update_browse_data)'>" + rowId + "</a>";
                    cellStyle += "width:25px";
                }
                slice.append('<td onclick="select_row_browse(' + rowId + ');" class="' + style + '" style="' + cellStyle + '">' + cell + '</td>');
            }
        }
        $('#rows_content').append('<tr class="' + style + '" style="height:16px;"></tr>');
        $('#rows_content').append('<tr id="removed_idx" class="' + style + '" style="height:16px;"></tr>');
        $('#rows_content').append('<tr class="' + style + '" style="height:16px;"></tr>');
        $('#rows_content').append('<tr id="totals_slice" class="' + style + '" style="height:16px;"></tr>');
        slice = $('#removed_idx');
        for (var i = 0; i < myRowsHeaderIdxRemoved.length; i++) {
            if (typeof headers[myRowsHeaderIdxRemoved[i]] == "undefined")
                continue;
            slice.append("<td><a href='javascript:addHeader(" + i + ");'>+" + headers[myRowsHeaderIdxRemoved[i]] + "</a></td>");
        }
        slice = $('#totals_slice');
        slice.append("<a href='javascript:toggleTotals();>Totals</a>");
        if (showTotals) {
            slice.append("attackers:&nbsp;" + totals.a + " attack_mult:&nbsp;" + totals.am + " defenders:&nbsp;" + totals.d + " defence_mult:&nbsp;" + totals.dm + " money:&nbsp;" + totals.money + " fuel:&nbsp;" + totals.fuel + " rows:&nbsp;" + data.length);
        }
        if (myRows.length > 0) {
            var r = myRows.join(",");
            var saved = readCookie("myRows");
            if (saved == null || saved !== r) {
                createCookie("myRows", r, 1000);
            }
        }
        if (!speedup)
            $(window).trigger('resize');
    }
}
function selectQuerySet(num) {
    num |= 0;
    if ($("#query_list_" + num).length > 0) {
        $('#queries .query_list').each(function() {
            $(this).css('display', 'none')
        });
        $("#query_list_" + num).css('display', 'inline');
        currentQuerySet = num;
        if (num == 3 && safeTransfers)
            getMyRowsDropdown();
    }
    $("#fastRow").remove();
    $("input[name=custom_name]:eq(0)").after("<div id='fastRow'>&nbsp;&nbsp;<a href='javascript:fastRowBuild()'>Fast Build</a> - needs 800K + RC cost on THIS row.</div>");
}
function getCurrentRowData(targ) {
    if (_currentRow == -1 || typeof _currentRow === "undefined" && newUpdates) {
        _currentRow = parseInt($($(".selected-col")[0]).html(), 10);
        return parseInt($($(".selected-col")[targ]).html(), 10);
    } else {
        return getRowData(_currentRow, targ);
    }
}
function getCurrentRowId() {
    return current_row_id;
}
var firstRun = 0;
function update_browse_data(data) {
    myRowId = getCurrentRowId();
    var ATTACKER_COST = 20;
    var myATTACK_MULTIPLIER = getCurrentRowData(8);
    var adjustedAttackMultiplier = 0;
    if (myATTACK_MULTIPLIER > 2) {
        var adjustedAttackMultiplier = myATTACK_MULTIPLIER - 2;
    }
    adjustedAttackMultiplier = Math.floor(adjustedAttackMultiplier / 3);
    var MONEY_HAUL = (adjustedAttackMultiplier + 1) * 10;
    var FUEL_HAUL = MONEY_HAUL;
    var DEFENDER_LOSS = .25;
    var FUEL_COST_FACTOR = 1 / Math.pow(2, adjustedAttackMultiplier);
    var ATTACK_RANGE = FUEL_HAUL * Math.pow(2, adjustedAttackMultiplier);
    var myMONEY = getCurrentRowData(4);
    var myFUEL = getCurrentRowData(6);
    var myATTACKERS = getCurrentRowData(7);
    var headers = row_format;
    headers.splice(12, headers.length - 12);
    headers.push(['Attack_with_Recd', 'Attack_with_Recd', 1]);
    headers.push(['1_Strike_Money', '1_Strike_Money', 1]);
    headers.push(['1_Strike_Fuel', '1_Strike_Fuel', 1]);
    headers.push(['Recd._Atks', 'Recd._Atks', 1]);
    headers.push(['&Delta;_fuel', '&Delta;_fuel', 1]);
    headers.push(['&Delta;_money', '&Delta;_money', 1]);
    headers.push(['&Delta;_profit', '&Delta;_profit', 1]);
    headers.push(['&Delta;_atk', '&Delta;_atk', 1]);
    headers.push(['Max_Money_Transfer', 'Max_Money_Transfer', 1]);
    headers.push(['Max_Fuel_Transfer', 'Max_Fuel_Transfer', 1]);
    headers.push(['Max_Attackers_Transfer', 'Max_Attackers_Transfer', 1]);
    if (typeof data === "String" || typeof data === "string") {
        data = eval('(' + data + ')');
    }
    $('#browse_content').empty();
    if (data.no_fuel) {
        $('#browse_query').html("<span style='color:red'>Row " + data.row_id + " must have at least 1 fuel to browse.</span>");
    } else if (data.outOfRange) {
        $('#browse_query').html("<span style='color:red'>Browse target out of range.</span>");
    } else {
        $('#browse_query').html("SELECT * FROM rows WHERE row_id>=" + data.start + " and row_id<" + (data.start + 10) + ";<br>" +
                ('prev'in data ? "<a href='#' onClick='updateBrowse({\"row_id\":" + data.row_id + ", \"start\":" + data.prev + "});return false'><< rows " + data.prev + " to " + (data.prev + 9) + "</a>" : "") + " [cost 1 fuel - <a href='#' onClick='updateBrowse({\"row_id\":" + data.row_id + ", \"start\":" + data.start + "});return false'>refresh</a>] " +
                (data.next ? "<a href='#' onClick='updateBrowse({\"row_id\":" + data.row_id + ", \"start\":" + data.next + "});return false'>rows " + data.next + " to " + (data.next + 9) + " >></a>" : ""));
        var out = '<tr class="odd-row"><th class="even-col"></th>';
        var style;
        var counter = 0;
        for (var i = 0; i < headers.length; i++) {
            if (isHiddenCols(i) == 0) {
                style = (counter++ % 2) ? 'odd-col' : 'even-col';
                out += '<th class="' + style + '"><a href="javascript:addHiddenCols(' + i + ')">' + String(headers[i][1]).replace("_", "_<br />") + "</a></th>";
            }
        }
        out += "</tr>";
        for (var i = 0; i < data.rows.length; i++) {
            style = (i % 2) ? 'odd' : 'even';
            var row = data.rows[i];
            no_attack = row['no_attack'];
            row_class = row['class'];
            can_delete = row['can_delete'];
            if (can_delete)
                row_class = "can-delete " + row_class;
            out += "<tr class='" + row_class + '-' + style + "'><td class='even-col' style='color:red'>" +
                    (no_attack ? "<span title='attacked within last 10 seconds'>*</span>" : "") + "</td>";
            row = row['fields'];
            var defRowId = parseInt(row[0], 10);
            var defRowMoneyFacs = parseInt(row[3], 10);
            var defRowMoney = parseInt(row[4], 10);
            var defRowFuel = parseInt(row[6], 10);
            var defRowAtkrs = parseInt(row[7], 10);
            var defRowAtkMult = parseInt(row[8], 10);
            var defRowDefrs = parseInt(row[9], 10);
            var defRowDefMult = parseInt(row[10], 10);
            var firstStrikeMoney = " ";
            var firstStrikeFuel = " ";
            var suggestedAtkrs = " ";
            var fuelUse = " ";
            var lostAttackers = " ";
            var deltaAttackers = " ";
            var deltaMoney = " ";
            var deltaFuel = " ";
            var deltaProfit = " ";
            var transMoney = " ";
            var transFuel = " ";
            var transAttackers = " ";
            var attackable = false;
            var stupid = false;
            var good = false;
            var atkDistance = Math.abs(myRowId - defRowId);
            var atk = " ";
            if (defRowMoney > 0) {
                firstStrikeMoney = Math.floor((defRowAtkrs * defRowAtkMult * 1.1 / myATTACK_MULTIPLIER) +
                        (defRowDefrs * defRowDefMult * 1.1 / myATTACK_MULTIPLIER) +
                        (defRowMoney / MONEY_HAUL));
                firstStrikeFuel = Math.floor((defRowAtkrs * defRowAtkMult * 1.1 / myATTACK_MULTIPLIER) +
                        (defRowDefrs * defRowDefMult * 1.1 / myATTACK_MULTIPLIER) +
                        (defRowFuel / FUEL_HAUL));
                if (atkDistance <= ATTACK_RANGE) {
                    suggestedAtkrs = Math.min(myATTACKERS, Math.floor(myFUEL / (atkDistance * FUEL_COST_FACTOR)), Math.max(firstStrikeMoney, firstStrikeFuel));
                }
                else {
                    suggestedAtkrs = Math.min(myATTACKERS, Math.floor(myFUEL / (atkDistance * FUEL_COST_FACTOR)), firstStrikeMoney);
                }
                fuelUse = 0;
                lostAttackers = 0;
                deltaAttackers = 0;
                deltaMoney = 0;
                deltaFuel = 0;
                deltaProfit = 0;
                if (suggestedAtkrs >= 1) {
                    fuelUse = Math.floor(atkDistance * FUEL_COST_FACTOR * suggestedAtkrs);
                    lostAttackers = 0 - (Math.floor(Math.min(suggestedAtkrs, (defRowAtkrs * defRowAtkMult * 1.1 / myATTACK_MULTIPLIER))) +
                            Math.floor(Math.min(suggestedAtkrs, (defRowDefrs * defRowDefMult * 1.1 / myATTACK_MULTIPLIER))));
                    if (Math.abs(lostAttackers) >= suggestedAtkrs) {
                        lostAttackers = 0 - suggestedAtkrs;
                        stupid = true;
                    }
                    deltaAttackers = lostAttackers;
                    deltaMoney = Math.min(Math.floor(suggestedAtkrs + lostAttackers) * MONEY_HAUL, defRowMoney);
                    deltaProfit = deltaMoney + lostAttackers * 20;
                    if (typeof deltaProfit == "undefined") {
                        deltaProfit = "reload myrows";
                    }
                    var deltaFuel = Math.min(Math.floor(suggestedAtkrs + lostAttackers) * FUEL_HAUL, defRowFuel) - fuelUse;
                }
                var atkRange = Math.min(myATTACK_MULTIPLIER - defRowAtkMult, myATTACK_MULTIPLIER - defRowDefMult);
                attackable = atkRange < 4;
                good = deltaProfit > 0 && deltaFuel > 0 && attackable;
                var blacklisted = false;
                if (blacklistRows.length > 0) {
                    for (var xx = 0; xx < blacklistRows.length; xx++) {
                        var rr = parseInt($.trim(blacklistRows[xx]), 10);
                        var dd = parseInt(defRowId, 10);
                        if (rr === dd) {
                            blacklisted = true;
                            break;
                        }
                    }
                }
                if (!stupid && attackable && (deltaProfit > 0 || deltaFuel + (deltaProfit * fuelRatio) > 0)) {
                    if (!blacklisted) {
                        var atk = '<div class="queries"><span class="query"><span class="button">' + '<input name="submit" value="ATTACK" onclick="querySubmit(this);$(this).parent().parent().parent().hide()" type="button" class="clickme">' + '</span><span class="desc">' + '<input name="target" size="3" value="' + defRowId + '" type="hidden">' + '<input name="attackers" value="' + suggestedAtkrs + '" size="3" type="">' + '<input name="query" value="Attack" type="hidden">' + '<input name="row_id" value="' + myRowId + '" type="hidden">' + '</span></div>';
                    } else {
                        var atk = "**BL**";
                    }
                }
            }
            if (defRowMoneyFacs > 0 && myFUEL > 0 && atkDistance > 0) {
                transMoney = Math.max(Math.min(myMONEY, Math.floor(myFUEL / (atkDistance * FUEL_COST_FACTOR)) * 100), 0);
                transAttackers = Math.max(Math.min(myATTACKERS, Math.floor(myFUEL / (atkDistance * FUEL_COST_FACTOR))), 0);
                transFuel = Math.floor((myFUEL / (100 +
                        (atkDistance * FUEL_COST_FACTOR)) * 100));
            }
            row.push(atk);
            row.push(firstStrikeMoney);
            row.push(firstStrikeFuel);
            row.push(suggestedAtkrs);
            row.push(deltaFuel);
            row.push(deltaMoney);
            row.push(deltaProfit);
            row.push(deltaAttackers);
            row.push(transMoney);
            row.push(transFuel);
            row.push(transAttackers);
            var counter = 0;
            for (var j = 0; j < row.length; j++) {
                var color = 'black';
                var sty = "style='";
                var clazz = "";
                if (!attackable) {
                    sty += "text-decoration:line-through;";
                    clazz += "row_noAttack ";
                }
                if (stupid) {
                    sty += "color:#770000;";
                    clazz += "row_stupid ";
                    var potentialXX = false;
                    var survivorsXX = Math.floor((parseInt(firstStrikeMoney, 10) * parseInt(myATTACK_MULTIPLIER, 10) - parseInt(defRowAtkrs, 10) * parseInt(defRowAtkMult, 10) - parseInt(defRowDefrs, 10) * parseInt(defRowDefMult, 10)) / parseInt(myATTACK_MULTIPLIER, 10));
                    var lossXX = parseInt(firstStrikeMoney, 10) - survivorsXX;
                    if (lossXX * 20 < defRowMoney) {
                        potentialXX = true;
                    }
                    if (potentialXX && attackable) {
                        sty += "text-decoration:underline";
                    }
                }
                else if (good == 1) {
                    sty += "color:#007700;";
                    clazz += "row_good ";
                }
                else if (deltaProfit > 0) {
                    sty += "color:#000077;";
                    clazz += "row_goodDelta ";
                }
                else if (deltaFuel + (deltaProfit * fuelRatio) > 0) {
                    sty += "color:#777700;";
                    clazz += "row_goodFuel ";
                }
                sty += "'";
                if (isHiddenCols(j) == 0) {
                    style = ((counter++ % 2) ? 'odd-col ' : 'even-col ') + clazz;
                    ;
                    out += "<td class='" + style + "' " + sty + ">" +
                            evilDF(row[j]) + "</td>";
                }
            }
            out += "</tr>";
        }
        $('#browse_content').html(out);
        $(":button").click(function() {
            disableActionButtons();
        });
    }
    if (!speedup)
        onResize();
}
function disableActionButtons() {
    $(":button").each(function() {
        this.disabled = true
    });
    $(":button").fadeTo("250", ".1");
    $(document).ready(function() {
        setTimeout('$(":button").fadeTo("250","1");$(":button").each( function() { this.disabled = false } );', 2700);
    });
}
var browse = function() {
    var links = $(".panel_header:nth-child(2)").find("a");
    $(links[2]).click();
}
function createCookie(name, value, days) {
    var expires = "";
    if (days) {
        var date = new Date();
        date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
        expires = "; expires=" + date.toUTCString();
    }
    document.cookie = name + "=" + value + expires + "; path=/";
}
function readCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ')
            c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0)
            return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) {
    createCookie(name, "", -1);
}
function buyAttackers(num, id) {
    $.post("/update/queries", {"attackers": num, "query": "BuyAttackers", "row_id": id, "submit": "go"});
}
function buyDefenders(num, id) {
    $.post("/update/queries", {"defenders": num, "query": "BuyDefenders", "row_id": id, "submit": "go"});
}
var last_log = '';
var log_kind = 'personal';
var log_updating = 0;
var re1 = '(UPDATE)';
var re2 = '.*?';
var re3 = '(\\d+)';
var re4 = '.*?';
var re5 = '(\\d+)';
var re6 = '.*?';
var re7 = '(\\d+)';
var re8 = '.*?';
var re9 = '(\\d+)';
var re10 = '.*?';
var re11 = '(\\d+)';
var re12 = '.*?';
var re13 = '(\\d+)';
function update_log(data)
{
    var rows = getMyRows();
    if (speedup)
        return;
    log_updating = 0;
    $('#query_log_content tr').each(function() {
        this.className = this.className.replace(/\bnew-/, '');
    });
    if (!data['timestamp'])
        return;
    $('#query_log_content #no_queries').remove();
    last_log = data['timestamp'];
    data = data['logs'];
    for (var i = 0; i < data.length; i++)
    {
        even = "even";
        if ($('#query_log_content tr').length % 2)
            even = "odd";
        var run_by = (data[i]['run_by'] ? "<div class='run_by'>run by " + data[i]['run_by'] + ":</div>" : "");
        $('#query_log_content').prepend('<tr class="' + data[i]['class'] + even + '">' + '<td class="timestamp">' + data[i]['display_time'] + '</td>' + '<td class="query">' + run_by +
                data[i]['query_text'] + '</td>' + '<td class="execute_length">' + data[i]['execute_length'] + '</td>' + '</tr>');
        var p = new RegExp(re1 + re2 + re3 + re4 + re5 + re6 + re7 + re8 + re9 + re10 + re11 + re12 + re13, ["i"]);
        var m = p.exec(data[i]['query_text']);
        if (m && m.length > 0)
        {
            var word = m[1];
            var int1 = m[2];
            var int2 = m[3];
            var int3 = m[4];
            var int4 = m[5];
            var int5 = m[6];
            var int6 = m[7];
            if (word == "UPDATE") {
                var attackers = parseInt(m[3], 10) - parseInt(m[2], 10);
                var money = parseInt(m[4], 10);
                var fuel = parseInt(m[5], 10) - parseInt(m[6], 10)
                var rowId = parseInt(m[7], 10);
                var profit = money + (attackers * 20);
                for (var f = 0; f < rows.length; f++) {
                    if (parseInt(rows[f], 10) === rowId) {
                        df += Math.floor(fuel * 0.90);
                        dm += Math.floor(profit * 0.90);
                        $("#df").html(df).css("color", (fuel > 0 ? "black" : "red"));
                        $("#dm").html(dm).css("color", (profit > 0 ? "black" : "red"));
                    }
                }
            }
        }
    }
}
function update_chat_log(data)
{
    if (speedup)
        return;
    log_updating = 0;
    $('#query_log_content tr').each(function() {
        this.className = this.className.replace(/\bnew-/, '');
    });
    if (!data['timestamp'])
        return;
    $('#query_log_content #no_queries').remove();
    last_log = data['timestamp'];
    data = data['logs'];
    for (var i = 0; i < data.length; i++)
    {
        if (data[i]['class'] == "chat " || data[i]['query_text'].indexOf("CHAT ") == 0) {
            even = "even";
            if ($('#query_log_content tr').length % 2)
                even = "odd";
            var run_by = (data[i]['run_by'] ? "<div class='run_by'>run by " + data[i]['run_by'] + ":</div>" : "");
            $('#query_log_content').prepend('<tr class="' + data[i]['class'] + even + '">' + '<td class="timestamp">' + data[i]['display_time'] + '</td>' + '<td style="padding-left:15px" class="query">' + run_by +
                    data[i]['query_text'] + '</td>' + '<td class="execute_length">' + data[i]['execute_length'] + '</td>' + '</tr>');
        }
    }
}
function updateLog() {
    if (speedup)
        return;
    if (log_updating)
        return;
    log_updating = 1;
    setTimeout("log_updating=0;", 10000);
    if (log_kind === "chat") {
        $.post('/update/log', {'last': last_log, 'kind': "personal"}, update_chat_log, data = 'json');
    } else {
        $.post('/update/log', {'last': last_log, 'kind': log_kind}, update_log, data = 'json');
    }
}
function global_log() {
    if (speedup)
        return;
    if (log_kind == "global")
        return updateLog();
    log_kind = "global";
    last_log = '';
    $('#query_log_content').empty();
    updateLog();
    $('#global_link').css('color', 'black');
    $('#personal_link').css('color', 'blue');
    $('#chat_link').css('color', 'blue');
}
function personal_log() {
    if (speedup)
        return;
    if (log_kind == "personal")
        return updateLog();
    log_kind = "personal";
    last_log = '';
    $('#query_log_content').empty();
    updateLog();
    $('#global_link').css('color', 'blue');
    $('#personal_link').css('color', 'black');
    $('#chat_link').css('color', 'blue');
}
function chat_log() {
    if (speedup)
        return;
    if (log_kind == "chat")
        return updateLog();
    log_kind = "chat";
    last_log = '';
    $('#query_log_content').empty();
    updateLog();
    $('#global_link').css('color', 'blue');
    $('#personal_link').css('color', 'blue');
    $('#chat_link').css('color', 'black');
}
function doResize()
{
    topmargin = 20;
    leftmargin = 20;
    rightmargin = 20;
    bottommargin = 20;
    spacing = 20;
    resizeTimer = null;
    totalWidth = $(window).width();
    totalHeight = $(window).height();
    totalWidth = (totalWidth - leftmargin - rightmargin - spacing);
    totalHeight = (totalHeight - topmargin - bottommargin - spacing);
    $header = dd.elements.dashboard_header;
    $header.moveTo(leftmargin, 20);
    $header.resizeTo(totalWidth + spacing, $header.h);
    topmargin = $header.h + topmargin + spacing;
    totalHeight -= $header.h + spacing;
    $topleft = dd.elements.topleft;
    $topleft.moveTo(leftmargin, topmargin);
    $topleft.resizeTo(totalWidth / 2, totalHeight / 2);
    resizeRows();
    var inside_height = $('#rows_headers').height() + $('#topleft .panel_header').height() + 20;
    if ($topleft.h > inside_height)
    {
    }
    $bottomleft = dd.elements.bottomleft;
    $bottomleft.moveTo(leftmargin, topmargin + spacing + $topleft.h);
    $bottomleft.resizeTo(totalWidth / 2, totalHeight - $topleft.h);
    var tr_height = $('#browse_content').height() + $('#topright .panel_header').height() + 20;
    var br_height = Math.min(150, totalHeight);
    br_height = Math.max(br_height, totalHeight - tr_height);
    tr_height = totalHeight - br_height;
    $topright = dd.elements.topright;
    $topright.moveTo(leftmargin + $topleft.w + spacing, topmargin);
    $topright.resizeTo(totalWidth / 2, tr_height);
    $bottomright = dd.elements.bottomright;
    $bottomright.moveTo(leftmargin + $topright.w + spacing, topmargin + spacing + $topright.h);
    $bottomright.resizeTo(totalWidth / 2, br_height);
    $('.panel_header').each(function() {
        $(this).next().height(dd.elements[$(this).parent().attr('id')].h - $(this).height());
    });
    $('#loading').css('display', 'none');
    if ($('.queries').height() != queries_height) {
        resizeQueries();
        queries_height = $('.queries').height();
    }
}
function resizeRows() {
}
(function($) {
    $.fn.constrainInput = function(config) {
        var settings = $.extend({allowedCharsRegex: ".*"}, config);
        var re = new RegExp(settings.allowedCharsRegex);
        $.each(this, function() {
            var input = $(this);
            var keypressEvent = function(e) {
                e = e || window.event;
                var k = e.charCode || e.keyCode || e.which;
                if (e.ctrlKey || e.altKey || k == 8) {
                    return true;
                } else if ((k >= 41 && k <= 122) || k == 32 || k > 186) {
                    return(re.test(String.fromCharCode(k)));
                }
                return false;
            }
            input.bind("keypress", keypressEvent);
        });
        return this;
    };
})(jQuery);