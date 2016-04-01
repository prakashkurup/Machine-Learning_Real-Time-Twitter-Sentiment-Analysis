// CMPE 239 Sentiment Analysis
// Client-side code


$(document).ready(function () {
    "use strict";
    var keyword = "";
    var socket = io.connect("http://localhost:3000");
    // var socket = io.connect("https://sentiment-of-tweets.herokuapp.com/");

    //Turn off UTC to use local time zone
    Highcharts.setOptions({
        global: {
            useUTC: false
        }
    });

    //Display pie chart---------------------------------------------------PIE CHART---------------------------------------------------------------------------------
    var pieC = new Highcharts.Chart({
        chart: {
            renderTo: "pieChart",
            plotBackgroundColor: null,
            plotBorderWidth: null,
            plotShadow: false,
            options3d: {
                enabled: true,
                alpha: 45,
                beta: 0
            }            
        },
        title: {
            text: "PIE CHART SENTIMENT",
        },
        tooltip: {
            formatter: function() {
                return "<b>"+ this.point.name +"</b>: "+ this.percentage.toFixed(1) +" %";
            }
        },
        plotOptions: {
            pie: {
                allowPointSelect: true,
                cursor: "pointer",
                depth: 35,
                dataLabels: {
                    enabled: true,
                    color: "#000000",
                    connectorColor: "#000000",
                    formatter: function() {
                        return "<b>"+ this.point.name +"</b>: "+ this.percentage.toFixed(1) +" %";
                    }
                }
            }
        },
        series: [{ //Filler data
            type: "pie",
            name: "Distribution",
            // data: [
            //     ["Neutral", 4], 
            //     ["Positive", 3],
            //     ["Negative", 3]             
            // ]

            data:[{
                name: 'Neutral',
                y: 4
            },{
                name: 'Positive',
                y: 3
            },{
                name: 'Negative',
                y: 3
            }]

        }]
    });

    //Display dynamic line chart----------------------------------------------------------LINE CHART-----------------------------------------------------------------------
    var lineChart = new Highcharts.Chart({
        chart: {
            renderTo: "lineChart",
            defaultSeriesType: "spline"
        },
        title: {
            text: "REAL-TIME SENTIMENT SCORE"
        },
        xAxis: {
            type: "datetime",
            tickPixelInterval: 150,
            maxZoom: 20 * 1000
        },
        yAxis: {
            minPadding: 0.2,
            maxPadding: 0.2,
            title: {
                text: "SENTIMENT SCORE",
                margin: 80
            }
        },
        series: [{
            name: "SENTIMENT SCORE",
            data: []
        }]
    }); 



    //display column chart---------------------------------------------------------COLUMN CHART-------------------------------------------------------------------
    var colC = new Highcharts.Chart({
        chart: {
            renderTo: "columnChart",
            type: 'column',
            options3d: {
                enabled: true,
                alpha: 15,
                beta: 15,
                viewDistance: 25,
                depth: 40
            },
            marginTop: 80,
            marginRight: 40
        },
        title: {
            text: 'COLUMN CHART SENTIMENT'
        },
        xAxis: {
            categories: ['Global Tweets']
        },
        yAxis: {
            min: 0,
            title: {
                text: '# of tweets'
            },
            stackLabels: {
                enabled: true,
                style: {
                    fontWeight: 'bold',
                    color: (Highcharts.theme && Highcharts.theme.textColor) || 'gray'
                }
            }
        },
        legend: {
            align: 'right',
            x: -30,
            verticalAlign: 'top',
            y: 25,
            floating: true,
            backgroundColor: (Highcharts.theme && Highcharts.theme.background2) || 'white',
            borderColor: '#CCC',
            borderWidth: 1,
            shadow: false
        },
        tooltip: {
            formatter: function() {
                return '<b>'+ this.x +'</b><br/>'+
                    this.series.name +': '+ this.y +'<br/>'+
                    'Total: '+ this.point.stackTotal;
            }
        },
        plotOptions: {
            column: {
                stacking: 'normal',
                dataLabels: {
                    enabled: true,
                    color: (Highcharts.theme && Highcharts.theme.dataLabelsColor) || 'white',
                    style: {
                        textShadow: '0 0 3px black'
                    }
                }
            }
        },
        series: [{
            name: 'Neutral',
            data: [1]
        }, {
            name: 'Positive',
            data: [1]
        }, {
            name: 'Negative',
            data: [1]
        }]
    });

    //Listen for current state of app----------------------------------------------CURRENT STATE---------------------------------------------------------------------
    socket.on("state", function(inUse){
        keyword = inUse.keyword;
        $('#status').html('<h3 class="text-warning"> SEARCHING "'+ keyword +'" </h3>');
        //If app is in use, show "stop" button. Else, show search bar.
        if(inUse.state){
            $("#stop").show();
            $("#search").hide(); 
        }else{
            $("#stop").hide();
            $("#search").show();
        }
    });       

    //Handles keyword submission-----------------------------------------------------------KEYWORD SUBMISSION------------------------------------------------------------
    $("#searchForm").on("submit", function(evt) {
        evt.preventDefault();
        var topic = $("#topic").val();
        //Handles case when keyword is empty string.
        if(topic === "" || topic === null){
            return;
        }
        //Tells server about new keyword to track
        socket.emit("topic", topic);
        $('#status').html('<h3 class="text-warning"> SEARCHING "'+ keyword +'" </h3>');
        $("#stop").show();
        $("#search").hide();
    });

    // Handles event when user stops analysis
    $("#stopForm").on("submit", function(evt) {
        evt.preventDefault();
        socket.emit("stopStreaming", "dummy");
        $("#stop").hide();
        $("#search").show();
    });

    
    // Handles real-time data updates----------------------------------------------------------DATA UPDATES------------------------------------------------------------------
    socket.on("data", function(data) {

        // pie chart data updates----------------------------------------------PIE DATA----------------------------------------------------------------
        pieC.series[0].setData([
            ["Neutral",data.neu],   
            ["Positive",data.pos],
            ["Negative", data.neg]           
        ]);
        

        // line chart data updates--------------------------------------------LINE DATA--------------------------------------------------------------
        var shift = data.total > 200;
        var x = (new Date()).getTime();
        var y = data.currentScore;


        //-----------------------------------------------------------------------COLUMN DATA------------------------------------------------------------------
        colC.series[0].setData([data.neu]);
        colC.series[1].setData([data.pos]);
        colC.series[2].setData([data.neg]);



        // table data update--------------------------------------------------TABLE DATA---------------------------------------------------------------------------
        $("#tweet").html(data.tweet);
        $("#totalTweet").html(data.total);
        $("#positiveTweet").html(data.pos);
        $("#negativeTweet").html(data.neg);
        $("#neutralTweet").html(data.neu);
        var sentimentScore = (data.pos - data.neg) / (data.pos + data.neg);
        $("#sentimentScore").html(parseFloat(sentimentScore).toFixed(2));

        lineChart.series[0].addPoint( [x,y],true, shift);
    });
    //-----------------------------------------------------------------------------------------------------------------------------------------------------------------





    // Handles updates to Last 10 Analysis Table
    socket.on("list", function(tweets) {
        console.log(tweets);
        var title = "<h4 class='text-center'>LAST 10 KEYWORDS ANALYZED</h4>";
        var table = title + "<table class='table table-condensed table-bordered'>";
        table = table + "<tr><td><b>KEYWORD</b></td><td><b>TOTAL TWEETS</b></td><td><b>SENTIMENT SCORE</b></td></tr>";
        for (var i = tweets.length-1; i >=  0; i--) {
            table = table + "<tr><td>" + tweets[i].keyword + "</td>";
            table = table + "<td>" + tweets[i].total + "</td>";
            table = table + "<td>" + tweets[i].score.toFixed(2) + "</td></tr>";
        }

        $("#recentSearch").html(table);
    });

});

