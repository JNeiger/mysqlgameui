$("#dashboard_header").html($("#dashboard_header").html() + '<br/><a href="javascript:togglePanel2();">Show Attackable Rows</a>&nbsp;&nbsp;<a href="javascript:togglePanel3();">Legend</a>');
$(".dashboard").before('<div id="panel2" style="position: absolute; width: 600px; height: 300px; top: 320px; border:1px solid #000; left: 20px; z-index: 999; background-color:#FFF; cursor: auto;">');
$(".dashboard").before('<div id="panel3" style="position: absolute; width: 600px; height: 300px; top: 320px; border:1px solid #000; left: 20px; z-index: 999; background-color:#FFF; cursor: auto;">');
$("#panel2, #panel3").hide();
var rowHeaders = row_format.valueOf();
var currentRow;
var previousArgs;
var panelShown2 = false; 
var panelShown3 = false;

if (rowHeaders.length === 12)
{
    rowHeaders.push([['can_defend'], ['attack'], 1]);
    //update_rows;
    updateRows(rowID());
}
function togglePanel2() {
    panelShown2 = !panelShown2;
    if (panelShown2) {
        $("#panel2").show();
    } else {
        $("#panel2").hide();
    }
    updatePanel2();
}
function updatePanel2() {
    $("#panel2").html('<div style="border-bottom:2px #000 solid;">Possible rows to attack&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a style="padding-left:10px" href="javascript:togglePanel2();">[close]</a></div>' + 'Will be done soon. Hopefully <br/>');
}
function togglePanel3() {
    panelShown3 = !panelShown3;
    if (panelShown3) {
        $("#panel3").show();
    } else {
        $("#panel3").hide();
    }
    updatePanel3();
}
function updatePanel3() {
    $("#panel3").html('<div style="border-bottom:2px #000 solid;">Legend&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a style="padding-left:10px" href="javascript:togglePanel3();">[close]</a></div>' + 'Strike through means friendly or empty space<br/>' + '<font color="green">Green means is profitable in terms of fuel and money to attack<br/>' + '<font color="AA4400">Orange means it\'s profitable in terms of fuel but not money<br/>' + '<font color="blue">Blue means it\'s profitable in terms of money but not fuel to attack<br/>' + '<font color="black">Black means it\'s not profitable in terms of fuel and money to attack<br/><br/>' + 'All calculations on based upon your selected row in "Your rows"');
}
function update_rows(data)
{
    if (!data.length)
        return;
    $('#rows #no_rows').remove();
    method = data.shift();
    if (method == 'refresh') {
        $('#rows_content').empty();
        $('#rows_headers').empty();

        rowID(data.shift());
        //rowHeaders = row_format;//data.shift();
        for (var i = 0; i < data.length; i++)
        {
            data[i][12] = data[i][7] * 20 + Math.floor(data[i][9] * 10 / 2);
        }

        for (var i = 0; i < rowHeaders.length; i++)
        {
            header = rowHeaders[i];
            style = (i % 2) ? 'odd-row' : 'even-row';
            $('#rows_headers').append('<tr class="' + style + '">' +
                    '<th><span class="odd-col">' + header[0] + '</span></th>' +
                    '</tr>');
            $('#rows_content').append('<tr class="' + style + '"></tr>');
            slice = $('#rows_content tr').eq(i);
            for (var j = 0; j < data.length; j++)
            {
                var stile = "";
                var checkBoxs = "";

                if (rowID() === data[j][0])
                {
                    style = 'selected-col';
                    currentRow = data[j];
                } else
                {
                    style = (j % 2) ? 'odd-col' : 'even-col'
                }


                if (data[j][12] < data[j][4] && i === 12)
                {
                    switch (style)
                    {
                        case 'odd-col':
                            stile = "background-color: FFE4E1;";
                            break;
                        case 'even-col':
                            stile = "background-color: FFC0CB;";
                            break;
                        case 'selected-col':
                            stile = "background-color: FFC0CB;";
                    }
                }

                slice.append('<td onclick="select_row(' + data[j][0] + ');" id="row_' + data[j][0] + '_' + rowHeaders[i] + '" class="' + style + '" style="' + stile + '">' + data[j][i] + '</td>');

            }
        }
        $(window).trigger('resize');

    }
}
function update_browse_data(data) {
    $('#browse_content').empty();
    if (data.no_fuel) {
        $('#browse_query').html("<span style='color:red'>Row " + data.row_id + " must have at least 1 fuel to browse.</span>");
    } else if (data.outOfRange) {
        $('#browse_query').html("<span style='color:red'>Browse target out of range.</span>");
    } else {
        $('#browse_query').html("SELECT * FROM rows WHERE row_id>=" + data.start + " and row_id<" + (data.start + 10) + ";<br>" +
                ('prev' in data ? "<a href='#' onClick='updateBrowse({\"row_id\":" + data.row_id + ", \"start\":" + data.prev + "});return false'><< rows " + data.prev + " to " + (data.prev + 9) + "</a>" : "") +
                " [cost 1 fuel - <a href='#' onClick='updateBrowse({\"row_id\":" + data.row_id + ", \"start\":" + data.start + "});return false'>refresh</a>] " +
                (data.next ? "<a href='#' onClick='updateBrowse({\"row_id\":" + data.row_id + ", \"start\":" + data.next + "});return false'>rows " + data.next + " to " + (data.next + 9) + " >></a>" : "")
                );
        var headers = row_format;//data.shift();
        var out = '<tr class="odd-row"><th class="even-col"></th>';
        var style;
        for (var i = 0; i < headers.length; i++) { //>
            style = (i % 2) ? 'odd-col' : 'even-col';
            out += '<th class="' + style + '">' + String(headers[i][1]).replace("_", "_<br />") + "</th>";
        }
        out += "</tr>";
        for (var i = 0; i < data.rows.length; i++) {
            style = (i % 2) ? 'odd' : 'even';

            var row = data.rows[i];
            var stile = ''
            var smart = true;
            var attackersNeeded;

            no_attack = row['no_attack'];
            row_class = row['class'];
            can_delete = row['can_delete'];
            if (can_delete)
                row_class = "can-delete " + row_class;

            out += "<tr class='" + row_class + '-' + style + "'><td class='even-col' style='color:red'>" +
                    (no_attack ? "<span title='attacked within last 10 seconds'>*</span>" : "") + "</td>";


            row = row['fields'];

            if (row_class === "row-clique" || (Math.max(row[8], row[10]) - currentRow[8]) < -3)//under 3)
            {
                stile += 'text-decoration:line-through;';
                smart = false;
            } else
            {
                var attackersLost = Math.ceil(row[7]/*atackers*/ * row[8]/*atkX*/ * 1.2 / currentRow[8]/*atkX*/)
                        + Math.ceil(row[9]/*.defenders()*/ * row[10]/*.defX()*/ * 1.2 / currentRow[8]/*.atkX()*/);
                var attackerModifier = Math.floor(Math.abs(currentRow[8]/*.atkX()*/ - 2) / 3);
                var carry = 10 * (attackerModifier + 1);
                attackersNeeded = attackersLost + Math.ceil(Math.max(row[4]/*.money()*/, row[6]/*.fuel()*/) / carry);
                var fuelNet = row[6]/*.fuel()*/ - Math.ceil(attackersNeeded * Math.abs(row[0] - currentRow[0]) * Math.pow(.5, attackerModifier));
                var moneyNet = row[4] - attackersLost * 20;

                if (row_class === "row-other")
                {
                    if (moneyNet > 0 && fuelNet > 0)
                        stile += "color: green;";
                    else if (moneyNet < 0 && fuelNet > 0)
                        stile += "color: AA4400;";
                    else if (moneyNet > 0 && fuelNet < 0)
                        stile += "color: blue;";
                    else {
                        stile += "color: black;";
                        smart = false;
                    }
                } else
                {
                    stile += 'color: black;';
                    smart = false;
                }
            }


            for (var j = 0; j < row.length; j++) {
                style = (j % 2) ? 'odd-col' : 'even-col';
                out += "<td class='" + style + "' style='" + stile + "'>" +
                        (headers[j][2] ? "<div style='width:" + headers[j][2] + ";overflow:hidden;text-overflow:ellipses;' title='" + addslashes(row[j]) + "'>" + row[j] + "</div>" : row[j]) + // truncate rows with width set
                        "</td>";
            }
            if (smart)
            {
                out += '<td><div class="queries"><span class="query"><span class="button">' +
                        '<input name="submit" value="ATTACK" onclick="querySubmit(this);$(this).parent().parent().parent().hide()" type="button" class="clickme">' +
                        '</span><span class="desc">' +
                        '<input name="target" size="3" value="' + row[0] + '" type="hidden">' +
                        '<input name="attackers" value="' + attackersNeeded + '" size="3" type="">' +
                        '<input name="query" value="Attack" type="hidden">' +
                        '<input name="row_id" value="' + currentRow[0] + '" type="hidden">' +
                        '</span></div>' +
                        '</td>'
            }
            out += "</tr>";
        }
        $('#browse_content').html(out);
        $(":button").click(function() {
            disableActionButtons();
        });

    }
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

function select_row(id)
{
    updateRows(id);
    update_queries(id);
    if (previousArgs !== undefined)
        updateBrowse(previousArgs);
}

function updateBrowse(fields) {
    previousArgs = fields;
    $.post('update/browse', fields, update_browse_data, data = 'json');
}

function buyAttackers(num, id) {
    $.post("/update/queries", {"attackers": num, "query": "BuyAttackers", "row_id": id, "submit": "go"});
}

function querySubmit(button){
    $('#queries_response_string').html("...<br>");
    console.log(getInputsInRow(button));
    var inputs = getInputsInRow(button);
    
    if (inputs['defenders'] === 'max')
    {
        inputs['defenders'] = Math.floor(currentRow[4] / 10);
    }else if( inputs['attackers'] === 'max' )
    {
        inputs['attackers'] = Math.floor(currentRow[4] / 10);
    }else if(inputs['money_factories'] === 'max')
    {
        var sum = 0;
        var ctr;
        for (var i = currentRow[3] + 1; sum  + Math.pow(2, i) * 10 < currentRow[4]; ++i)
        {
            sum += Math.pow(2, i) * 10;
            ctr++;
        }
        inputs['money_factories'] = ctr;
   }else if(inputs['fuel_factories'] === 'max')
   {
       var sum = 0;
       var ctr;
       for (var i = currentRow[5] + 1; sum  + Math.pow(2, i) * 7.5 < currentRow[4]; ++i)
       {
           sum += Math.pow(2, i) *7.5;
           ctr++;
       }
       inputs['fuel_factories'] = ctr;
   }else if(inputs['amount'] === 'max')
   {
       //not yet implemented
   }
   $.post('update/queries', inputs, update_queries_data);
}
