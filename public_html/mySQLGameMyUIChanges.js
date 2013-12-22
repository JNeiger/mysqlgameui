// Adds a link into the head of the file
// as well as adding two other panels, one for a Legend of the changes,
// and the other to show the attackable rows within a few hundred
$("#dashboard_header").html($("#dashboard_header").html() + '<br/><a href="javascript:togglePossibleAttacks();">Show Attackable Rows</a>&nbsp;&nbsp;<a href="javascript:toggleLegend();">Legend</a>');
$(".dashboard").before('<div id="possibleAttacks" style="position: absolute; width: 600px; height: 300px; top: 320px; border:1px solid #000; left: 20px; z-index: 999; background-color:#FFF; cursor: auto;">');
$(".dashboard").before('<div id="legend" style="position: absolute; width: 600px; height: 300px; top: 320px; border:1px solid #000; left: 20px; z-index: 999; background-color:#FFF; cursor: auto;">');
$("#possibleAttacks, #legend").hide();

// adds new heads to the rows
// current headers include Name, Owner, Fuel, Row Num etc.
var rowHeaders = row_format.valueOf();

// The selected row in the top left panel
// containing a list of all your own rows
var currentRow;

// Used to keep track of whether you have searched
// in the top right panel
var previousArgs;

// Whether the custom panels are shown
var possibleAttacksShown = false; 
var legendShown = false;

// Push the custom header onto the list of headers
// Can defend gives a approx amount of money/fuel you can defend
// Worth attacking in either terms of money or fuel
if (rowHeaders.length === 12)
{
    rowHeaders.push([['can_defend'], ['attack'], 1]);
    updateRows(rowID());
}

// Toggles the two panels
function togglePossibleAttacks() {
    possibleAttacksShown = !possibleAttacksShown;
    if (possibleAttacksShown) {
        $("#possibleAttacks").show();
    } else {
        $("#possibleAttacks").hide();
    }
    updatePossibleAttacks();
}
function updatePossibleAttacks() {
    $("#possibleAttacks").html('<div style="border-bottom:2px #000 solid;">Possible rows to attack&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a style="padding-left:10px" href="javascript:togglePossibleAttacks();">[close]</a></div>' + 'Will be done soon. Hopefully <br/>');
}
function toggleLegend() {
    legendShown = !legendShown;
    if (legendShown) {
        $("#legend").show();
    } else {
        $("#legend").hide();
    }
    updateLegend();
}

// I probably can take this one out and just make it static
function updateLegend() {
    $("#legend").html('<div style="border-bottom:2px #000 solid;">Legend&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; <a style="padding-left:10px" href="javascript:toggleLegend();">[close]</a></div>' + 'Strike through means friendly or empty space<br/>' + '<font color="green">Green means is profitable in terms of fuel and money to attack<br/>' + '<font color="AA4400">Orange means it\'s profitable in terms of fuel but not money<br/>' + '<font color="blue">Blue means it\'s profitable in terms of money but not fuel to attack<br/>' + '<font color="black">Black means it\'s not profitable in terms of fuel and money to attack<br/><br/>' + 'All calculations on based upon your selected row in "Your rows"');
}

// Updates personal panel row with the custome header 
// and colors the row depending on how much they can hold and currently have
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

                // Updates grid color based upon if it is over its max carry size
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

// Updates the browse panel that contains all the other rows
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
                
        var out = '<tr class="odd-row"><th class="even-col"></th>';
        var style;
        
        // Places headers at top of grid
        for (var i = 0; i < rowHeaders.length; i++) { //>
            style = (i % 2) ? 'odd-col' : 'even-col';
            out += '<th class="' + style + '">' + String(rowHeaders[i][1]).replace("_", "_<br />") + "</th>";
        }
        out += "</tr>";
        
        // Places the row values
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
            
            // Makes sure we are not friends with the other row and
            // are even able to attack them due to the row limitation
            if (row_class === "row-clique" || (Math.max(row[8], row[10]) - currentRow[8]) < -3)
            {
                stile += 'text-decoration:line-through;';
                smart = false;
            } else
            {
                // Calculate everything to see if its a good idea
                var attackersLost = Math.ceil(row[7]/*atackers*/ * row[8]/*atkX*/ * 1.2 / currentRow[8]/*atkX*/)
                        + Math.ceil(row[9]/*.defenders()*/ * row[10]/*.defX()*/ * 1.2 / currentRow[8]/*.atkX()*/);
                var attackerModifier = Math.floor(Math.abs(currentRow[8]/*.atkX()*/ - 2) / 3);
                var carry = 10 * (attackerModifier + 1);
                attackersNeeded = attackersLost + Math.ceil(Math.max(row[4]/*.money()*/, row[6]/*.fuel()*/) / carry);
                var fuelNet = row[6]/*.fuel()*/ - Math.ceil(attackersNeeded * Math.abs(row[0] - currentRow[0]) * Math.pow(.5, attackerModifier));
                var moneyNet = row[4] - attackersLost * 20;

                // Assign colors to the row's text based upon the productivity of it
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
                
                // If it is not productive assign it 
                {
                    stile += 'color: black;';
                    smart = false;
                }
            }

            // Fills in the cells with the data
            for (var j = 0; j < row.length; j++) {
                style = (j % 2) ? 'odd-col' : 'even-col';
                out += "<td class='" + style + "' style='" + stile + "'>" +
                        (headers[j][2] ? "<div style='width:" + headers[j][2] + ";overflow:hidden;text-overflow:ellipses;' title='" + addslashes(row[j]) + "'>" + row[j] + "</div>" : row[j]) + // truncate rows with width set
                        "</td>";
            }
            
            // If it is a good idea
            //      Ie: Productive in fuel
            //          Money
            //          Or both
            // Add a button in to the cell that allows you to just click to attack with the recommended attackers
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
        
        // Places data into the base html
        $('#browse_content').html(out);
        
        // Puts a timeout on the buttons as to not spam the server with request
        // and adhear to the timeout on each of the row actions placed on by the developers
        $(":button").click(function() {
            disableActionButtons();
        });

    }
    onResize();
}

// Places a small disable onto the button at each click to stop spam to the server
function disableActionButtons() {
    $(":button").each(function() {
        this.disabled = true
    });
    $(":button").fadeTo("250", ".1");
    $(document).ready(function() {
        setTimeout('$(":button").fadeTo("250","1");$(":button").each( function() { this.disabled = false } );', 2700);
    });
}

// Selects a row from personal ones and changes the browse data
// to reflect the new row's possible attackers
function select_row(id)
{
    updateRows(id);
    update_queries(id);
    if (previousArgs !== undefined)
        updateBrowse(previousArgs);
}

// Updates the browse data and remebers which rows are being viewed
function updateBrowse(fields) {
    previousArgs = fields;
    $.post('update/browse', fields, update_browse_data, data = 'json');
}

// Buys a certain amount of attackers
// Not used currently
function buyAttackers(num, id) {
    $.post("/update/queries", {"attackers": num, "query": "BuyAttackers", "row_id": id, "submit": "go"});
}

// Grabs the submitted data whenever a method is called
// To increase some attribute of the row
// Checks to see if they placed the keyword "max" into a field
// and figures the max able to be bought
function querySubmit(button){
    $('#queries_response_string').html("...<br>");
    console.log(getInputsInRow(button));
    var inputs = getInputsInRow(button);
    
    if (inputs['defenders'] === 'max')
    {
        inputs['defenders'] = Math.floor(currentRow[4] / 10);
    }else if( inputs['attackers'] === 'max' )
    {
        inputs['attackers'] = Math.floor(currentRow[4] / 20);
    }else if(inputs['money_factories'] === 'max')
    {
        var sum = 0;
        var ctr = 0;
        for (var i = currentRow[3] + 1; sum  + Math.pow(2, i) * 10 < currentRow[4]; ++i)
        {
            sum += Math.pow(2, i) * 10;
            ctr++;
        }
        inputs['money_factories'] = ctr;
   }else if(inputs['fuel_factories'] === 'max')
   {
       var sum = 0;
       var ctr = 0;
       for (var i = currentRow[5] + 1; sum  + Math.pow(2, i) * 7.5 < currentRow[4]; ++i)
       {
           sum += Math.pow(2, i) *7.5;
           ctr++;
       }
       inputs['fuel_factories'] = ctr;
   }else if(inputs['amount'] === 'max')
   {
       //not yet implemented
       //will be for movement of Fuel, Money, and Attackers
   }
   $.post('update/queries', inputs, update_queries_data);
}
