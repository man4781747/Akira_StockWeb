<template>
  <div class="">
  {{ totalWidthPiexl }}
    <div id="chart"></div>

  </div>
</template>

<script>
import Testdata from './test.json'
export default {
  data () {
  return {
    L_allData: [],
    yAxis: undefined,
    xScale: undefined,
    xAxis: undefined,
    yScale: undefined,
    lastX: -999,
    nowX: 40,  // 整體圖片的x平移量
    nowY: 30,  // 整體圖片的x平移量
    total_height: 800,
    total_width: 800,
    x_padding: 7, //單位: 天
    x_oneDayPixel: 10, // 1天占用多少piexl
    y_onePricePixel: 1, // 1元占多少Pixel
    x_scale: 1.,
    y_axis_width: 40,
    x_axis_height: 30,
    Svg: undefined
  }
  },
  computed:{
    MaxDate() {
      return new Date(d3.max(this.L_time))
    },
    MinDate() {
      return new Date(d3.min(this.L_time))
    },
    L_time() {
      if (this.L_allData.length===0) {
        return []
      }
      return this.L_allData.map((x) => x.date)
    },
    DiffDays(){
      if (this.L_time === undefined) {
        return 365
      }
      return Math.abs((this.MaxDate - this.MinDate)/1000/24/60/60)
    },
    totalWidthPiexl() {
      return this.DiffDays*this.x_oneDayPixel
    },

    MaxPrice() {
      return d3.max(this.L_allData.map((x) => x.high))
    },
    MinPrice() {
      return d3.min(this.L_allData.map((x) => x.low))
    },
    MeanPrice(){
      return d3.mean(this.L_allData.map((x) => x.high))
    },
    totalHeightPiexl() {
      return Math.abs(this.MaxPrice*1.1)*this.y_onePricePixel
    },
    // xScale() {
    //   return d3.scaleLinear()
    //   .domain([d3.min(this.L_allData.map((x) => x.low)), d3.max(this.L_allData.map((x) => x.high))])
    //   .range([this.total_height-this.x_axis_height*2, 0])
    // },
    // xAxis() {
    //   return d3.axisBottom(this.xScale).ticks(this.DiffDays/this.x_padding) 
    // },

    // yScale() {
    //   return d3.scaleLinear()
    //     .domain([d3.min(this.L_allData.map((x) => x.low)), d3.max(this.L_allData.map((x) => x.high))])
    //     .range([this.total_height-this.x_axis_height*2, 0])
    // },
    // yAxis() {
    //   return d3.axisLeft(this.yScale)
    // }

  },
  methods:{
    getXTimeInSvg(xPointOnWindow, yPointOnWindow) {
      const svg = document.getElementById('main-svg');
      let SVGPoint = svg.createSVGPoint();
      let CTM = svg.getScreenCTM();
      SVGPoint.x = xPointOnWindow;
      SVGPoint.y = yPointOnWindow;
      // clientPoint = SVGPoint.matrixTransform(CTM);
      let testSVGPoint = SVGPoint.matrixTransform(CTM);
      // console.log("滑鼠在SVG中的位置:", testSVGPoint.x, testSVGPoint.y);
      // console.log("當前圖像x軸平移量: ", this.nowX)
      // console.log("x軸整體有效長度為(最右端為0，向左增加): ", this.totalWidthPiexl)
      // console.log("最左端時間為: ", this.MinDate)
      // console.log("最右端時間為: ", this.MaxDate)
      // console.log("圖像視窗寬度為: ", this.total_width)
      // console.log("所以當前點擊的位置在x軸整體有效的: ", this.total_width-testSVGPoint.x+this.nowX)
      var returnDate = new Date(map_range(
          this.total_width-testSVGPoint.x+this.nowX,
          0, this.totalWidthPiexl,
          this.MaxDate.getTime(), this.MinDate.getTime()
        ))
      // console.log(returnDate)
      return returnDate
    },
    getXYValueInSvg(xPointOnWindow, yPointOnWindow) {
      const svg = document.getElementById('main-svg');
      let SVGPoint = svg.createSVGPoint();
      let CTM = svg.getScreenCTM();
      SVGPoint.x = xPointOnWindow;
      SVGPoint.y = yPointOnWindow;
      // clientPoint = SVGPoint.matrixTransform(CTM);
      let testSVGPoint = SVGPoint.matrixTransform(CTM);
      // console.log("滑鼠在SVG中的位置:", testSVGPoint.x, testSVGPoint.y);
      // console.log("當前圖像x軸平移量: ", this.nowX)
      // console.log("x軸整體有效長度為(最右端為0，向左增加): ", this.totalWidthPiexl)
      // console.log("最左端時間為: ", this.MinDate)
      // console.log("最右端時間為: ", this.MaxDate)
      // console.log("圖像視窗寬度為: ", this.total_width)
      // console.log("所以當前點擊的位置在x軸整體有效的: ", this.total_width-testSVGPoint.x+this.nowX)
      var returnDate = new Date(map_range(
        this.total_width-testSVGPoint.x+this.nowX,
        0, this.totalWidthPiexl,
        this.MaxDate.getTime(), this.MinDate.getTime()
      ))
      // console.log("滑鼠在SVG中的位置:", testSVGPoint.x, testSVGPoint.y);
      // console.log("當前圖像y軸平移量: ", this.nowY)
      // console.log("y軸整體有效長度為(最下端為0，向上增加): ", this.totalHeightPiexl)
      // console.log("最下端數值為: ", 0)
      // console.log("最上端時間為: ", this.MaxPrice)

      var returnPrice = map_range(
        this.total_height-testSVGPoint.y+this.nowY,
        0, this.totalHeightPiexl,
        0, this.MaxPrice*1.1
      )
      return [returnDate,returnPrice]
    },
    getXYPointInSvg(xDate, yPrice){
      return [
        map_range(
          xDate.getTime(),
          this.MaxDate.getTime(), this.MinDate.getTime(),
          0, this.totalWidthPiexl
        ),
        map_range(
          yPrice,
          this.MaxPrice, 0,
          this.totalHeightPiexl, 0
        ),
      ]
    },
    createYAxisEventBK(){
      var bk_y = this.Svg.append('g').attr("id","event-y-bk-canvas").style('z-index', '99999')
      bk_y.append('rect').attr('width', this.y_axis_width).attr('height', this.total_height-this.x_axis_height).attr('x', 0).attr('y', 0).attr('fill', 'green')
      var DragEle = null
      var LastPosition;
      var This = this
      // document.getElementById("event-x-bk-canvas").addEventListener("wheel", (e)=>this.XAxisEvent__ZoomOnX(e.clientX, e.deltaY/100.))
      document.getElementById("event-y-bk-canvas").addEventListener("mousedown", (e)=> {DragEle = e.target;LastPosition=e.clientY})
      document.getElementById("event-y-bk-canvas").addEventListener("mousemove", (e)=> {
        if (DragEle) {
          This.YAxisEvent__VerticalDisplacement(-e.clientY+LastPosition);
          LastPosition=e.clientY
        }
      })
      document.getElementById("event-y-bk-canvas").addEventListener("mouseup", (e)=> {DragEle = null})
      document.getElementById("event-y-bk-canvas").addEventListener("mouseleave", (e)=> {DragEle = null})
      var This = this
      document.getElementById("event-y-bk-canvas").addEventListener("click", (e)=> {
        var test = This.getXYValueInSvg(e.clientX, e.clientY)
      })
    },

    createXAxisEventBK(){
      var bk_x = this.Svg.append('g').attr("id","event-x-bk-canvas").style('z-index', '99999')
      bk_x.append('rect').attr('width', this.total_width).attr('height', this.x_axis_height).attr('x', 0).attr('y', this.total_height-this.x_axis_height).attr('fill', 'red')
      .attr('draggable', true)
      var DragEle = null
      var LastPosition;
      var This = this
      document.getElementById("event-x-bk-canvas").addEventListener("wheel", (e)=>this.XAxisEvent__ZoomOnX(e.clientX, e.deltaY/100.))
      document.getElementById("event-x-bk-canvas").addEventListener("mousedown", (e)=> {DragEle = e.target;LastPosition=e.clientX})
      document.getElementById("event-x-bk-canvas").addEventListener("mousemove", (e)=> {
        if (DragEle) {This.XAxisEvent__HorizontalDisplacement(e.clientX-LastPosition);LastPosition=e.clientX}
      })
      document.getElementById("event-x-bk-canvas").addEventListener("mouseup", (e)=> {DragEle = null})
      document.getElementById("event-x-bk-canvas").addEventListener("mouseleave", (e)=> {DragEle = null})
    },

    createLineAreaEventBK(){
      var bk_line = this.Svg.append('g').attr("id","event-line-bk-canvas").style('z-index', '99999')
      bk_line.append('rect').attr('width', this.total_width-this.y_axis_width).attr('height', this.total_height-this.x_axis_height).attr('x', this.y_axis_width).attr('y', 0).attr('fill', 'yellow')
      var DragEle = null
      var LastPosition_X;
      var LastPosition_Y;
      var This = this
      document.getElementById("event-line-bk-canvas").addEventListener("wheel", (e)=>this.XAxisEvent__ZoomOnX(e.clientX, e.deltaY/100.))
      document.getElementById("event-line-bk-canvas").addEventListener("mousedown", (e)=> {DragEle = e.target;LastPosition_X=e.clientX;LastPosition_Y=e.clientY})
      document.getElementById("event-line-bk-canvas").addEventListener("mousemove", (e)=> {
        if (DragEle) {
          This.XAxisEvent__HorizontalDisplacement(e.clientX-LastPosition_X);LastPosition_X=e.clientX
          This.YAxisEvent__VerticalDisplacement(-e.clientY+LastPosition_Y);LastPosition_Y=e.clientY
        }
      })
      document.getElementById("event-line-bk-canvas").addEventListener("mouseup", (e)=> {DragEle = null})
      document.getElementById("event-line-bk-canvas").addEventListener("mouseleave", (e)=> {DragEle = null})
      // this.Svg.append('g').attr("id","line-canvas")
        // .attr('transform', 'translate('+this.nowX+', '+this.x_axis_height+')')
    },

    XAxisEvent__ZoomOnX(xPosition, dZoom){
      console.log(dZoom)
      let BeforeDate = this.getXTimeInSvg(xPosition, 0) //! 獲得縮放前，滑鼠位置的時間錨定點
      this.x_oneDayPixel += dZoom
      if (this.x_oneDayPixel < 5) {this.x_oneDayPixel=5}
      this.refleshXAxis()
      let AfterDate = this.getXTimeInSvg(xPosition, 0) //! 獲得縮放前，滑鼠位置的時間錨定點
      let shift_1 = map_range(
        BeforeDate.getTime(),
        this.MaxDate.getTime(), this.MinDate.getTime(),
        0, this.totalWidthPiexl
      )
      let shift_2 = map_range(
        AfterDate.getTime(),
        this.MaxDate.getTime(), this.MinDate.getTime(),
        0, this.totalWidthPiexl
      )
      this.refleshLinePath()
      this.XAxisEvent__HorizontalDisplacement(shift_1-shift_2)
    },
    XAxisEvent__HorizontalDisplacement(dX){
      this.nowX += dX
      document.getElementById("axis-x").attributes.transform.value='translate('+this.nowX+', '+(this.total_height-this.x_axis_height)+')'
      document.getElementById("line-canvas").attributes.transform.value='translate('+this.nowX+', '+this.nowY+')'
    },

    YAxisEvent__VerticalDisplacement(dY){
      this.nowY -= dY
      if (this.nowY<this.x_axis_height) {
        this.nowY = this.x_axis_height
      } else if (this.nowY>this.totalHeightPiexl-this.total_height+this.x_axis_height*2) {
        this.nowY = this.totalHeightPiexl-this.total_height+this.x_axis_height*2
      }
      let axisY = document.getElementById("axis-y")
      if (axisY) {
        axisY.attributes.transform.value='translate('+this.y_axis_width+', '+this.nowY+')'
      }
      let lineElement = document.getElementById("line-canvas")
      if (lineElement) {
        lineElement.attributes.transform.value='translate('+this.nowX+', '+this.nowY+')'
      }
    },

    refleshXAxis(){
      this.xScale = d3.scaleTime()
      .domain([this.MinDate, this.MaxDate])  // x軸頭與尾
      .range([-this.totalWidthPiexl+this.total_width, this.total_width]) // x軸頭尾的實際x值
      this.xAxis = d3.axisBottom(this.xScale).ticks(this.DiffDays/this.x_padding) 
      if (document.getElementById("axis-x")) {
        document.getElementById("axis-x").remove()
        this.Svg.append('g').call(this.xAxis).attr("id","axis-x")
        .attr('transform', 'translate('+this.nowX+', '+(this.total_height-this.x_axis_height)+')')
        .style('user-select', 'none').style('pointer-events', 'none')
        // for (let child of document.getElementById("axis-x").childNodes) {
        //   child.remove()
        // }
        // this.Svg.select("#axis-x").append('g').call(this.xAxis).attr("id","axis-x")
        // .attr('transform', 'translate('+this.nowX+', '+(this.total_height-this.x_axis_height)+')')
        // .style('user-select', 'none').style('pointer-events', 'none')
      }
      else {
        this.Svg.append('g').call(this.xAxis).attr("id","axis-x")
        .attr('transform', 'translate('+this.nowX+', '+(this.total_height-this.x_axis_height)+')')
        .style('user-select', 'none').style('pointer-events', 'none')
      }
    },
    refleshYAxis(){
      this.yScale = d3.scaleLinear()
        .domain([this.MaxPrice*1.1, 0])
        .range([-this.totalHeightPiexl+this.total_height-this.x_axis_height*2, this.total_height-this.x_axis_height*2])
      this.yAxis = d3.axisLeft(this.yScale)
      if (document.getElementById("axis-y")) {
        for (let child of document.getElementById("axis-y").childNodes) {
          child.remove()
        }
        this.Svg.select("#axis-y").append('g').call(this.yAxis).attr("id","axis-y")
          .attr('transform', 'translate('+this.y_axis_width+', '+this.nowY+')')
          .style('user-select', 'none').style('pointer-events', 'none')
      } else {
        this.Svg.append('g').call(this.yAxis).attr("id","axis-y")
          .attr('transform', 'translate('+this.y_axis_width+', '+this.nowY+')')
          .style('user-select', 'none').style('pointer-events', 'none')
      }
      // this.yScale = d3.scaleLinear()
      //   .domain([this.MaxPrice*1.1, 0])
      //   .range([-this.totalHeightPiexl+this.total_height-this.x_axis_height*2, this.total_height-this.x_axis_height*2])
      // this.yAxis = d3.axisLeft(this.yScale)
      // this.Svg.select("#axis-y").append('g').call(this.yAxis).attr("id","axis-y")
      //     .attr('transform', 'translate('+this.y_axis_width+', '+this.nowY+')')
      //     .style('user-select', 'none').style('pointer-events', 'none')
      // this.Svg.append('g').call(this.yAxis).attr("id","axis-y")
      //     .attr('transform', 'translate('+this.y_axis_width+', '+this.nowY+')')
      //     .style('user-select', 'none').style('pointer-events', 'none')
    },
    refleshLinePath() {
      if (document.getElementById("line-canvas") !== null) {
        // console.log(123)
        // document.getElementById("line-canvas").remove()
        for (let child of document.getElementById("line-canvas").childNodes) {
          child.remove()
        }
        this.Svg.select("#line-canvas").attr('transform', 'translate('+this.nowX+', '+this.x_axis_height+')')
        this.Svg.select("#line-canvas").append('path')
        .datum(this.L_allData)
        .attr('fill', 'none')
        .attr('stroke', 'red')
        .attr('stroke-width', 1)
        .attr('d', d3.line().x((v, i) => {
            return this.xScale(new Date(v["date"]))
        }).y((v, i) => {
            return this.yScale(v["high"])
        }))
      }
      else {
        this.Svg.append('g').attr("id","line-canvas")
      }
      
      // var line = this.Svg.append('g').attr("id","line-canvas")
      //   .attr('transform', 'translate('+this.nowX+', '+this.x_axis_height+')')

      // line.append('path')
      //   .datum(this.L_allData)
      //   .attr('fill', 'none')
      //   .attr('stroke', 'red')
      //   .attr('stroke-width', 1)
      //   .attr('d', d3.line().x((v, i) => {
      //       return this.xScale(new Date(v["date"]))
      //   }).y((v, i) => {
      //       return this.yScale(v["high"])
      //   }))
    },
    INIT__mainSvg() {
      var Chart = d3.select('#chart')
      this.Svg = Chart.append('svg')
      this.Svg.attr('width', this.total_width).attr('height', this.total_height).attr("id", 'main-svg')
    },
    INIT__YAxisZoom(){
      var test  = (this.getXYPointInSvg(new Date(), this.MeanPrice))[1]-this.total_height/2.
      this.YAxisEvent__VerticalDisplacement(-test)
    },
  },
  mounted(){
    window.test = this
    var This = this
    this.L_allData = Testdata
    this.y_onePricePixel = (this.total_height-this.x_axis_height)/((this.MaxPrice - this.MinPrice)*1.2)*1.5
    this.INIT__mainSvg()
    this.createLineAreaEventBK()
    this.refleshLinePath()
    this.createYAxisEventBK()
    this.refleshYAxis()
    this.createXAxisEventBK()
    this.refleshXAxis()
    this.refleshLinePath()
    this.INIT__YAxisZoom()
    
    // fetch("http://34.80.194.11:8080/test")
    // .then(function (response) {
    //   return response.json();
    // })
    // .then(function (myJson) {
    //   // This.L_allData = myJson

    //   var height = 800
    //   var padding = 30
    //   // var L_time = myJson.map((x) => x.date)
    //   var Chart = d3.select('#chart')
    //   This.Svg = Chart.append('svg')
    //   This.Svg.attr('width', This.total_width).attr('height', This.total_height).attr("id", 'main-svg')

    //   // var DiffDays = Math.abs((new Date(d3.min(L_time))-new Date(d3.max(L_time)))/1000/24/60/60)
    //   This.xScale = d3.scaleTime()
    //   .domain([new Date(d3.min(This.L_time)), new Date(d3.max(This.L_time))])  // x軸頭與尾
    //   .range([-This.totalWidthPiexl+This.total_width, This.total_width]) // x軸頭尾的實際x值
    //   This.xAxis = d3.axisBottom(This.xScale).ticks(This.DiffDays/This.x_padding) 

    //   This.yScale = d3.scaleLinear()
    //       .domain([d3.min(myJson.map((x) => x.low)), d3.max(myJson.map((x) => x.high))])
    //       .range([height-padding*2, 0])
    //   This.yAxis = d3.axisLeft(This.yScale)
      
    //   var bk = This.Svg.append('g').attr("id","event-bk-canvas").style('z-index', '99999')
    //   bk.append('rect').attr('width', This.total_width-40).attr('height', This.total_height-40).attr('x', 40).attr('y', 10).attr('fill', 'royalblue')
    //   var bk_x = This.Svg.append('g').attr("id","event-x-bk-canvas").style('z-index', '99999')
    //   bk_x.append('rect').attr('width', This.total_width).attr('height', 40).attr('x', 0).attr('y', This.total_height-30).attr('fill', 'red')

    //   This.refleshLinePath()
    //   // var line = This.Svg.append('g').attr("id","line-canvas")
    //   //   .attr('transform', 'translate('+This.nowX+', '+padding+')')

    //   // line.append('path')
    //   //   .datum(myJson)
    //   //   .attr('fill', 'none')
    //   //   .attr('stroke', 'red')
    //   //   .attr('stroke-width', 1)
    //   //   .attr('d', d3.line().x((v, i) => {
    //   //       return xScale(new Date(v["date"]))
    //   //   }).y((v, i) => {
    //   //       return yScale(v["high"])
    //   //   }))

    //   // line.append('path')
    //   // .datum(myJson)
    //   // .attr('fill', 'none')
    //   // .attr('stroke', 'blue')
    //   // .attr('stroke-width', 1)
    //   // .attr('d', d3.line().x((v, i) => {
    //   //     return xScale(new Date(v["date"]))
    //   // }).y((v, i) => {
    //   //     return yScale(v["low"])
    //   // }))

    //   // line.append('path')
    //   // .datum(myJson)
    //   // .attr('fill', 'none')
    //   // .attr('stroke', 'green')
    //   // .attr('stroke-width', 1)
    //   // .attr('d', d3.line().x((v, i) => {
    //   //     return xScale(new Date(v["date"]))
    //   // }).y((v, i) => {
    //   //     return yScale(v["close"])
    //   // }))
    


    //   This.Svg.append('g').call(This.xAxis).attr("id","axis-x")
    //       .attr('transform', 'translate('+This.nowX+', '+(height-padding)+')')
    //       .style('user-select', 'none')


    //   This.Svg.append('g').call(This.yAxis).attr("id","axis-y")
    //       .attr('transform', 'translate('+This.nowX+', '+padding+')')
    //       .style('user-select', 'none')

      
      
    //   document.getElementById("event-x-bk-canvas").addEventListener("wheel", function (e) {
    //     // console.log(e.deltaY); // logs the className of my_element
    //     let targetDate = This.getXTimeInSvg(e.clientX, e.clientY) //! 獲得縮放後，滑鼠位置最終的時間錨定點
    //     This.x_oneDayPixel += e.deltaY/100.
    //     if (This.x_oneDayPixel < 5) {This.x_oneDayPixel=5}
    //     This.refleshXAxis()
    //     //! 重新繪製縮放大小後的x軸後，需要再平移，將縮放錢滑鼠位置與時間錨定點重合
    //     //1. 找到縮放後，滑鼠縮放點的新時間
    //     let newDate = This.getXTimeInSvg(e.clientX, e.clientY)
    //     let shift_1 = map_range(
    //       newDate.getTime(),
    //       This.MaxDate.getTime(), This.MinDate.getTime(),
    //       0, This.totalWidthPiexl
    //     )
    //     let shift_2 = map_range(
    //       targetDate.getTime(),
    //       This.MaxDate.getTime(), This.MinDate.getTime(),
    //       0, This.totalWidthPiexl
    //     )
    //     // console.log(縮放前)
    //     This.nowX -= (shift_1-shift_2)
    //     //2. 求出時間差，將時間差回推成

    //     // document.getElementById("axis-x").remove()
    //     This.refleshLinePath()
    //   });

    //   document.getElementById("event-bk-canvas").addEventListener("wheel", function (d) {
    //     This.nowX += d.deltaY/1
    //     if (This.nowX<-This.y_axis_width) {This.nowX=-This.y_axis_width}
    //     if (This.nowX>This.totalWidthPiexl-This.total_width+This.y_axis_width*2) {This.nowX=This.totalWidthPiexl-This.total_width+This.y_axis_width*2}
    //     document.getElementById("axis-x").setAttribute("transform",'translate('+This.nowX+', '+(height-padding)+')')
    //     document.getElementById("line-canvas").setAttribute("transform",'translate('+This.nowX+', '+padding+')')
    //   });
      
    //   // Svg.on('wheel', function (d) {
    //   //   This.nowX += d.deltaY/1
    //   //   if (This.nowX>40) {This.nowX=40}
    //   //   if (This.nowX<-totalWidthPiexl-40) {This.nowX=-totalWidthPiexl-40}
    //   //   document.getElementById("axis-x").setAttribute("transform",'translate('+This.nowX+', '+(height-padding)+')')
    //   //   document.getElementById("line-canvas").setAttribute("transform",'translate('+This.nowX+', '+padding+')')
    //   // });


    // });

// // 绘制折线
// var line = svg.append('g')
//     .attr('transform', 'translate(40, '+padding+')')

// line.append('path')
//     .datum(dataset)
//     .attr('fill', 'none')
//     .attr('stroke', 'blue')
//     .attr('stroke-width', 1)
//     .attr('d', d3.line().x((v, i) => {
//         return xScale(i)
//     }).y((v, i) => {
//         return yScale(v)
//     }))

// // 绘制数据坐标圆点
// line.selectAll('circle').data(dataset).enter()
//     .append('circle')
//     .attr('cx', (v, i) => { return xScale(i)})
//     .attr('cy', (v, i) => { return yScale(v)})
//     .attr('r', 5)
//     .attr('fill', 'gold')
//     .attr('stroke', 'blue')

//     // 定义鼠标移入事件
//     .on('mouseover', function (e, v) {
//         // 放大坐标圆点
//         d3.select(this).attr('r', 7)

//         // 在光标上方显示坐标值
//         var pos = d3.pointer(e)
//         svg.append('text')
//             .text(v)
//             .attr('class', 'tooltip')
//             .attr('x', pos[0]+50)
//             .attr('y', pos[1]+20)
//             .attr('text-anchor', 'end')
//     })

//     // 定义鼠标移出事件
//     .on('mouseout', function () {
//         // 还原坐标圆点
//         d3.select(this).attr('r', 5)
//         // 移除坐标值提示标签
//         d3.select('.tooltip').remove()
//     })

  }
}
</script>
<style lang="postcss">
/* https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting */
</style>