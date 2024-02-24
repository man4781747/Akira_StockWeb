<template>
  <div class="">
    <!-- {{ MainSvgViewBoxString }} -->
    <!-- {{ 'width:'+y_axis_width+' px;height:'+(total_height-x_axis_height)+' px;' }} -->
    <div id="total-canvas" style="position: relative;" :style="'width:'+total_width+'px;height:'+total_height+'px;'">
      <div id="y-axis-div" style="position: absolute; top: 0;" :style="'width:'+y_axis_width+'px;height:'+(total_height-x_axis_height)+'px;'"></div>
      <div id="x-axis-div" style="position: absolute; bottom: 0;" :style="'width:'+total_width+'px;height:'+(x_axis_height)+'px;'"
        @wheel="(e) => XAxisEvent__ZoomOnX(e.clientX, e.deltaY/100.)"
      ></div>
      <div id="chart" style="position: absolute; top: 0;overflow: hidden;" :style="'width:'+(total_width-y_axis_width)+'px;height:'+(total_height-x_axis_height)+'px;left: '+y_axis_width+'px'">
        <svg id="main-svg" preserveAspectRatio="none" :width="total_width-y_axis_width" :height="total_height-x_axis_height"
          :viewBox="MainSvgViewBoxString" @click="showInfo" @wheel="(e) => XAxisEvent__ZoomOnX('main-svg', e.clientX, e.deltaY/100.)"
        ></svg>
      </div>
    </div>
    <!-- {{ chosedData }} -->
  </div>

</template>

<script>
import { tickStep } from 'd3'
import Testdata from './test.json'
export default {
  data () {
  return {
    L_allData: [],
    svg_xAxis: undefined,
    svg_yAxis: undefined,

    yAxis: undefined,
    xScale: undefined,
    xAxis: undefined,
    yScale: undefined,
    lastX: -999,

    nowX1: 0,
    nowX2: 0,
    nowY1: 0,
    nowY2: 0,

    mainSvgTotalWidth: 0,  //! 主圖的x寬度，在主圖繪製時會定下來，不隨X軸縮放而變化
    mainSvgTotalHeight: 0,  //! 主圖的x寬度，在主圖繪製時會定下來，不隨X軸縮放而變化

    // XAixsShift: 40,
    // YAixsShift: 0,

    // nowY: 30,  // 整體圖片的y平移量

    total_height: 800,
    total_width: 1200,
    x_padding: 7, //單位: 天
    // x_oneDayPixel: 10, // 1天占用多少piexl
    xLableMaxNumOnWindow: 12,
    // y_onePricePixel: 1, // 1元占多少Pixel
    x_scale: 1.,
    y_axis_width: 40,
    x_axis_height: 30,
    Svg: undefined,
    lastTargetMoneyBarID: "" ,
    chosedData: {},

    //! 五線譜相關資訊
    fiveLine__dataLen: Math.floor(365*2/7*5),
    fiveLine__dataStart: 0,
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

    //! 所有資料的時間跨度
    DiffDays(){
      if (this.L_time === undefined) {
        return 365
      }
      return Math.abs((this.MaxDate - this.MinDate)/1000/24/60/60)
    },

    //! x軸總寬度
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
      return Math.abs(this.YAxisValueRange[1] - this.YAxisValueRange[0])*this.y_onePricePixel
    },
    XAxisLabelNum() {
      //! 為保持x軸文字不會過於壅擠，動態計算畫面中的x軸區分塊數
      let oneXLabelPixel = this.total_width/this.xLableMaxNumOnWindow //滿足最大x軸區分不再畫面上超過指定數量對應的pixel數
      return Math.floor(this.totalWidthPiexl/oneXLabelPixel)
    },

    //! 獲得當前主繪圖的 ViewBox 範圍 [x1, y1, x2, y2]
    XY2ViewBoxValue(){
      return [
        new Date(Math.min(this.nowX1, this.nowX2)),
        Math.min(this.nowY1, this.nowY2),
        new Date(Math.max(this.nowX1, this.nowX2)),    
        Math.max(this.nowY1, this.nowY2),                
      ]
    },

    //! 獲得當前 ViewBox 的 String格式
    MainSvgViewBoxString(){
      try {
        var Value = this.XY2ViewBoxValue
        var xValue = this.xScale(Value[0])
        var yValue = this.yScale(Value[3])
        var xRange = this.xScale(Value[2]) - xValue
        var yRange = Math.abs(this.yScale(Value[1]) - yValue)
        return xValue+","+yValue+","+xRange+","+yRange
        // return xValue+","+(-this.totalHeightPiexl)+","+xRange+","+yRange
      } catch (e) {
        return "0,0,0,0"
      }
    },

    //! X軸相關參數
    
    XAixsShift(){
      return this.y_axis_width - this.xScale(this.XY2ViewBoxValue[0]) - this.x_oneDayPixel
    },

    XAxisValueRange(){
      return [this.MinDate, this.MaxDate]
    },

    xAxisWindowWidth(){
      return this.total_width
    },
    xAxisValueOnWindow(){

    },

    //! 一日所佔有的piexl數
    x_oneDayPixel() {
      return (this.total_width-this.y_axis_width)/((this.XY2ViewBoxValue[2]-this.XY2ViewBoxValue[0])/1000/60/60/24)
    },
    // xAxisTotalPixel () {
    //   return this.DiffDays*this.x_oneDayPixel
    // },

    //! y軸相關參數

    YAixsShift(){
      return this.total_height -  this.x_axis_height - this.yScale(this.XY2ViewBoxValue[1])
    },

    YAxisValueRange(){
      return [0, this.MaxPrice*1.1]
    },

    y_onePricePixel() {
      return (this.total_height-this.x_axis_height)/(this.XY2ViewBoxValue[3]-this.XY2ViewBoxValue[1])
    },

    yAxisWindowHieght(){
      return this.total_height-this.x_axis_height
    },



    //! 五線譜相關
    fiveLine__dataList () {
      var returnList = []
      for (let i in [...Array(this.fiveLine__dataLen).keys()]) {
        returnList.push(this.L_allData[this.fiveLine__dataStart - i])
      }
      return returnList
    },
    fiveLine__mean () {
      return d3.mean(this.fiveLine__dataList.map((x) => x.close))
    },
    fiveLine__deviation () {
      return d3.deviation(this.fiveLine__dataList.map((x) => x.close))
    },

    fiveLine__plotData () {
      var returnData = []
      var lastInde = this.fiveLine__dataList.length-1
      for (let i of [-2,-1,0,1,2]) {
        returnData.push({
          "y1": this.fiveLine__dataList[0]["close"] + i*this.fiveLine__deviation,
          "x1": this.fiveLine__dataList[0]["date"],
          "y2": this.fiveLine__dataList[lastInde]["close"] + i*this.fiveLine__deviation,
          "x2": this.fiveLine__dataList[lastInde]["date"],
        })
      }
      returnData[4]["color"] = "rgba(255,0,0, 0.3)"
      returnData[3]["color"] = "rgba(125,67,0, 0.3)"
      returnData[2]["color"] = "rgba(125,125,125, 0.3)"
      returnData[1]["color"] = "rgba(67,125,0, 0.3)"
      returnData[0]["color"] = "rgba(0,255,0, 0.3)"
      return returnData
    }
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
    showInfo(e){
      var pointInfo = this.WindowXY2svgXY(e.target.id, e.clientX, e.clientY)
      console.log(e.clientX, e.clientY)
      var DateGet = this.getTimeAndPriceInSvgWithSvgXY(pointInfo["XAxis"]["SVG"],0,true)[0]
      console.log(DateGet.format("Y-MM-dd hh:mm:ss"))

      // console.log(this.YAixsShift-pointInfo["YAxis"]["SVG"])
      // console.log(this.total_height, pointInfo["YAxis"]["SVG"], this.YAixsShift, e.clientY)
      // var returnPrice = map_range(
      //   this.XY2ViewBoxValue[1]-pointInfo["YAxis"]["SVG"]+this.YAixsShift,
      //   0, this.totalHeightPiexl,
      //   this.YAxisValueRange[0], this.YAxisValueRange[1]
      // )+this.XY2ViewBoxValue[3]

      // var returnDate = new Date(map_range(
      //   this.total_width-pointInfo["XAxis"]["SVG"]+this.XAixsShift,
      //   0, this.totalWidthPiexl,
      //   this.MaxDate.getTime(), this.MinDate.getTime()
      // )).addHours(12)
      // console.log(returnPrice, returnDate.format("Y-MM-dd"))

      // console.log(this.xScale(pointInfo["XAxis"]["SVG"]))

    },

    WindowXY2svgXY(SVGeleID, MouseX, MouseY){
      const svg = document.getElementById(SVGeleID);
      let SVGPoint = svg.createSVGPoint();
      let CTM = svg.getScreenCTM();
      // SVGPoint.x = MouseX;
      // SVGPoint.y = MouseY;
      let testSVGPoint = SVGPoint.matrixTransform(CTM)
      testSVGPoint.x = MouseX;
      testSVGPoint.y = MouseY;
      SVGPoint = testSVGPoint.matrixTransform(CTM.inverse());
      // console.log("目標svg:", SVGeleID)
      // console.log("滑鼠在視窗中的位置:", MouseX, MouseY);
      // console.log("滑鼠在SVG中的位置:", SVGPoint.x, SVGPoint.y);

      // console.log(MouseX, MouseY)
      // console.log(testSVGPoint)
      var returnValue = {
        "XAxis": {
          "SVG": SVGPoint.x,
          "Window": MouseX
        },
        "YAxis": {
          "SVG": SVGPoint.y,
          "Window": MouseY
        }
      }
      // console.log(returnValue)
      return returnValue
    },
    getTimeAndPriceInSvgWithSvgXY(xPointOnSvg, yPointOnSvg, IsMainSvg=false) {
      var returnDate
      if (IsMainSvg) {
        returnDate = [new Date(map_range(
          xPointOnSvg,
          0, this.mainSvgTotalWidth,
          this.MinDate.getTime(), this.MaxDate.getTime()
        )), 0]
      }
      else {
        returnDate = [new Date(map_range(
          this.total_width-testSVGPoint.x+this.XAixsShift,
          0, this.totalWidthPiexl,
          this.MaxDate.getTime(), this.MinDate.getTime()
        )), 0]
      }
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
      // console.log("當前圖像x軸平移量: ", this.XAixsShift)
      // console.log("x軸整體有效長度為(最右端為0，向左增加): ", this.totalWidthPiexl)
      // console.log("最左端時間為: ", this.MinDate)
      // console.log("最右端時間為: ", this.MaxDate)
      // console.log("圖像視窗寬度為: ", this.total_width)
      // console.log("所以當前點擊的位置在x軸整體有效的: ", this.total_width-testSVGPoint.x+this.XAixsShift)
      var returnDate = new Date(map_range(
        this.total_width-testSVGPoint.x+this.XAixsShift,
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
      bk_y.append('rect').attr('width', this.y_axis_width).attr('height', this.total_height-this.x_axis_height).attr('x', 0).attr('y', 0).attr('fill', '#F5F5F5')
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
      // document.getElementById("event-y-bk-canvas").addEventListener("click", (e)=> {
      //   var test = This.getXYValueInSvg(e.clientX, e.clientY)
      // })
    },

    createXAxisEventBK(){
      var bk_x = this.Svg.append('g').attr("id","event-x-bk-canvas").style('z-index', '99999')
      bk_x.append('rect').attr('width', this.total_width).attr('height', this.x_axis_height).attr('x', 0).attr('y', this.total_height-this.x_axis_height).attr('fill', '#F5F5F5')
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

    // createLineAreaEventBK(){
    //   var bk_line = this.Svg.append('g').attr("id","event-line-bk-canvas")
    //   bk_line.append('rect').attr('width', this.total_width-this.y_axis_width)
    //     .attr('height', this.total_height-this.x_axis_height).attr('y', 0).attr('fill', 'rgba(0,0,0,0.1')
    //   var DragEle = null
    //   var LastPosition_X;
    //   var LastPosition_Y;
    //   var This = this

    //   var date_bk_area = this.Svg.append('g')
    //   date_bk_area.append('rect').attr("id","date-bk-area")
    //     .attr('width', this.x_oneDayPixel).attr('height', this.total_height-this.x_axis_height).attr('x', this.y_axis_width).attr('y', 0).attr('fill', 'rgba(0,0,0,0.1')
    //     .attr("class","unselect")
    //     // .style("display","none")
    //   var date_bk_area_ele = document.getElementById("date-bk-area")
    //   document.getElementById("event-line-bk-canvas").addEventListener("wheel", (e)=>this.XAxisEvent__ZoomOnX(e.clientX, e.deltaY/100.))
    //   document.getElementById("event-line-bk-canvas").addEventListener("mousedown", (e)=> {
    //     DragEle = e.target
    //     LastPosition_X=e.clientX;LastPosition_Y=e.clientY
    //     date_bk_area.style("display", "none")
    //   })
    //   document.getElementById("event-line-bk-canvas").addEventListener("mousemove", (e)=> {
    //     if (DragEle) {
    //       This.XAxisEvent__HorizontalDisplacement(e.clientX-LastPosition_X);LastPosition_X=e.clientX
    //       This.YAxisEvent__VerticalDisplacement(-e.clientY+LastPosition_Y);LastPosition_Y=e.clientY
    //     }
    //     // let selectDate_AfterShift = This.getXYValueInSvg(e.clientX, e.clientY)[0].addHours(12)
    //     // var targetID = "mb-"+selectDate_AfterShift.format("Y-MM-dd")
    //     // if (This.lastTargetMoneyBarID !== targetID) {
    //     //   let lastRargetEle = document.getElementById(This.lastTargetMoneyBarID)
    //     //   if (lastRargetEle) {
    //     //     lastRargetEle.setAttribute("stroke-width",  This.x_oneDayPixel*0.5)
    //     //   }
    //     //   let targetEle = document.getElementById(targetID)
    //     //   if (targetEle) {
    //     //     targetEle.setAttribute("stroke-width",  This.x_oneDayPixel*0.7)
    //     //     window.tt =targetEle
    //     //     This.chosedData = This.L_allData[parseInt(targetEle.getAttribute("data-index"))]
            

    //     //   }
    //     //   This.lastTargetMoneyBarID = targetID
    //     //   date_bk_area_ele.setAttribute("x",  e.clientX)
    //     // }
    //   })
    //   document.getElementById("event-line-bk-canvas").addEventListener("mouseup", (e)=> {
    //     DragEle = null
    //     date_bk_area.style("display", "unset")
    //   })
    //   document.getElementById("event-line-bk-canvas").addEventListener("mouseleave", (e)=> {
    //     DragEle = null
    //     date_bk_area.style("display", "unset")
    //   })
    //   // this.Svg.append('g').attr("id","line-canvas")
    //     // .attr('transform', 'translate('+this.XAixsShift+', '+this.x_axis_height+')')
    // },

    XAxisEvent__ZoomOnX(SVGeleID, xPosition, dZoom){
      let BeforePosition = this.WindowXY2svgXY(SVGeleID, xPosition, 0) //! 獲得縮放前，滑鼠位置的時間錨定點
      let BeforeDate = this.getTimeAndPriceInSvgWithSvgXY(BeforePosition["XAxis"]["SVG"],0,true)[0]
      
      let BeforeValue = ((xPosition-this.y_axis_width)/(this.total_width-this.y_axis_width)) * (this.nowX2.getTime()-this.nowX1.getTime()) + this.nowX1.getTime()


      this.nowX1 = (new Date(this.nowX1)).addDays(dZoom)
      if (this.nowX1<this.MinDate) { this.nowX1 = new Date(this.MinDate) }
      this.nowX2 = (new Date(this.nowX2)).addDays(dZoom*-1)
      if (this.nowX2>this.MaxDate) { this.nowX2 = new Date(this.MaxDate) }


      let AfterValue = ((xPosition-this.y_axis_width)/(this.total_width-this.y_axis_width)) * (this.nowX2.getTime()-this.nowX1.getTime()) + this.nowX1.getTime()

      // console.log((BeforeValue-AfterValue)/1000)
      let dSeconds = (BeforeValue-AfterValue)/1000
      this.nowX1 = (new Date(this.nowX1)).addSeconds(dSeconds)
      this.nowX2 = (new Date(this.nowX2)).addSeconds(dSeconds)
      if (this.nowX1<this.MinDate) { this.nowX1 = new Date(this.MinDate) }
      if (this.nowX2>this.MaxDate) { this.nowX2 = new Date(this.MaxDate) }
      // this.reflashXAxis()
      // let AfterPosition = this.WindowXY2svgXY(SVGeleID, xPosition, 0) //! 獲得縮放前，滑鼠位置的時間錨定點
      // let AfterDate = this.getTimeAndPriceInSvgWithSvgXY(AfterPosition["XAxis"]["SVG"],0,true)[0]
      // let dSeconds = (BeforeDate-AfterDate)/1000
      // this.nowX1 = (new Date(this.nowX1)).addSeconds(dSeconds)
      // this.nowX2 = (new Date(this.nowX2)).addSeconds(dSeconds)
      // if (this.nowX1<this.MinDate) { this.nowX1 = new Date(this.MinDate) }
      // if (this.nowX2>this.MaxDate) { this.nowX2 = new Date(this.MaxDate) }

      // this.$nextTick( () => {
      //   let AfterPosition = this.WindowXY2svgXY(SVGeleID, xPosition, 0) //! 獲得縮放前，滑鼠位置的時間錨定點
      //   let AfterDate = this.getTimeAndPriceInSvgWithSvgXY(AfterPosition["XAxis"]["SVG"],0,true)[0]
      //   let dSeconds = (BeforeDate-AfterDate)/1000
      //   console.log(dSeconds)
      //   this.nowX1 = (new Date(this.nowX1)).addSeconds(dSeconds)
      //   this.nowX2 = (new Date(this.nowX2)).addSeconds(dSeconds)
      //   if (this.nowX1<this.MinDate) { this.nowX1 = new Date(this.MinDate) }
      //   if (this.nowX2>this.MaxDate) { this.nowX2 = new Date(this.MaxDate) }
      //   this.$nextTick( () => {
      //     // this.reflashXAxis()
      //   })
      // })
    },
    XAxisEvent__HorizontalDisplacement(dX){
      this.XAixsShift += dX
      if (this.XAixsShift < -10) {
        this.XAixsShift = -10
      } else if (this.XAixsShift > this.totalWidthPiexl + 10 - this.total_width + this.y_axis_width) {
        this.XAixsShift = this.totalWidthPiexl + 10 - this.total_width + this.y_axis_width
      }
      document.getElementById("x-axis-g").attributes.transform.value='translate('+this.XAixsShift+', 1)'
      document.getElementById("line-canvas").attributes.transform.value='translate('+this.XAixsShift+', '+this.nowY+')'
      document.getElementById("five-line").attributes.transform.value='translate('+this.XAixsShift+', '+(this.nowY)+')'
    },

    YAxisEvent__VerticalDisplacement(dY){
      this.nowY -= dY
      if (this.nowY<this.x_axis_height) {
        this.nowY = this.x_axis_height
      } else if (this.nowY>this.totalHeightPiexl-this.total_height+this.x_axis_height*2) {
        this.nowY = this.totalHeightPiexl-this.total_height+this.x_axis_height*2
      }
      let axisY = document.getElementById("y-axis-g")
      if (axisY) {
        axisY.attributes.transform.value='translate('+(this.y_axis_width-1)+', '+this.YAixsShift+')'
      }
      let lineElement = document.getElementById("line-canvas")
      if (lineElement) {
        // lineElement.attributes.transform.value='translate('+this.XAixsShift+', '+this.nowY+')'
      }

      let fiveLineElement = document.getElementById("five-lines")
      if (fiveLineElement) {
        fiveLineElement.attributes.transform.value='translate('+this.XAixsShift+', '+this.YAixsShift+')'
      }
    },
    //? 重繪整個X軸座標
    reflashXAxis(){
      this.xScale = d3.scaleTime()
      .domain(this.XAxisValueRange)  // x軸頭與尾
      .range([0, this.totalWidthPiexl]) // x軸頭尾的實際x值
      this.xAxis = d3.axisBottom(this.xScale)
      .ticks(this.XAxisLabelNum).tickFormat(d3.utcFormat("%-m/%-d"))

      if (document.getElementById("x-axis-svg")) {
        // for (let child of document.getElementById("x-axis-svg").childNodes) {
        //   child.remove()
        // }
      } else {
        this.svg_xAxis = d3.select('#x-axis-div').append('svg')
        this.svg_xAxis.attr('width', this.total_width).attr('height', this.x_axis_height).attr("id", 'x-axis-svg').append('g')
      }
      this.svg_xAxis.select('g').call(this.xAxis).attr('transform', 'translate('+(this.XAixsShift-1)+', 2)').attr("id", 'x-axis-g')
    },
    //? 重繪整個Y軸座標
    reflashYAxis(){
      this.yScale = d3.scaleLinear()
        .domain(this.YAxisValueRange)
        .range([0, -this.totalHeightPiexl])
      this.yAxis = d3.axisLeft(this.yScale)
      if (document.getElementById("y-axis-svg")) {
        for (let child of document.getElementById("y-axis-svg").childNodes) {
          child.remove()
        }
      } else {
        this.svg_yAxis = d3.select('#y-axis-div').append('svg')
        this.svg_yAxis.attr('width', this.y_axis_width).attr('height', this.total_height-this.x_axis_height).attr("id", 'y-axis-svg')
      }
      this.svg_yAxis.append('g').call(this.yAxis).attr('transform', 'translate('+(this.y_axis_width-1)+', '+(this.YAixsShift-1)+')').attr("id", 'y-axis-g')

      document.getElementById("y-axis-div").addEventListener("click", (e)=>this.WindowXY2svgXY("y-axis-svg",e.clientX, e.clientY))
    },
    reflashLinePath() {
      if (document.getElementById("line-canvas") !== null) {
        for (let child of document.getElementById("line-canvas").childNodes) {
          child.remove()
        }
      } 
      else {
        this.Svg.append('g').attr("id","line-canvas")
      }

      this.mainSvgTotalWidth = Math.abs(this.xScale(this.XAxisValueRange[1]) - this.xScale(this.XAxisValueRange[0]))
      this.mainSvgTotalHeight = Math.abs(this.yScale(this.YAxisValueRange[1]) - this.yScale(this.YAxisValueRange[0]))

      const g = this.Svg.select("#line-canvas").append("g")
        .attr("stroke-linecap", "round")
        .attr("stroke", "black")
        .selectAll("g")
        .data(this.L_allData)
        .join("g")

      // g.append("line")
      //   .attr("y1", d => this.yScale(d.low))
      //   .attr("y2", d => this.yScale(d.high))
      //   .attr("x1", d => this.xScale(new Date(d.date)))
      //   .attr("x2", d => this.xScale(new Date(d.date)))
      //   .attr("class","unselect")

      // g.append("line")
      //   .attr("id", d => ("mb-"+d.date).split(" ")[0])
      //   .attr("data-index", d => d.index)
      //   .attr("date", d => d.date)
      //   .attr("y1", d => this.yScale(d.open))
      //   .attr("y2", d => this.yScale(d.close))
      //   .attr("x1", d => this.xScale(new Date(d.date)))
      //   .attr("x2", d => this.xScale(new Date(d.date)))
      //   .attr("stroke-width", this.x_oneDayPixel*0.5)
      //   .attr("stroke", d => d.open > d.close ? d3.schemeSet1[0]
      //     : d.close > d.open ? d3.schemeSet1[2]
      //     : d3.schemeSet1[8])
      //   .attr("class","unselect")

      g.append("circle")
        .attr("id", d => ("mb-"+d.date).split(" ")[0])
        .attr("data-index", d => d.index)
        .attr("date", d => d.date)
        .attr("cy", d => this.yScale(d.open))
        .attr("cx", d => this.xScale(new Date(d.date)))
        .attr("r", 2)
        .attr("class","unselect")

      g.append("text")
      .attr("x", d => this.xScale(new Date(d.date)))
      .attr("dy", d => this.yScale(d.open)-10).attr("fill", 'red')
      .style("fill", 'red').style("font-size", '10px').style("text-anchor", 'middle')
      .text(d => new Date(d.date).format("Y/MM/dd"));

      g.append("text")
      .attr("x", d => this.xScale(new Date(d.date)))
      .attr("dy", d => this.yScale(d.open)-25).attr("fill", 'red')
      .style("fill", 'red').style("font-size", '10px').style("text-anchor", 'middle')
      .text(d =>  d.open);

      g.append("text")
        .attr("x", d => this.xScale(new Date(d.date)))
        .attr("dy", d => this.yScale(d.open)-37.5).attr("fill", 'red')
        .style("fill", 'red').style("font-size", '10px').style("text-anchor", 'middle')
        .text( d => "(" + this.xScale(new Date(d.date)).toFixed() + "," + (this.yScale(d.open)).toFixed()+")");

      // .append('textPath')
      // .text(d => new Date(d.date).format("Y-MM-dd"));
      // .attr({
      //   'xlink:href': '#mypath'
      // }).text('男丁格爾\'s 脫殼玩 http://abgne.tw');
      // var This = this
      // d3.selectAll('.money-bar').on('mouseover', function () {
      //   let pt = d3.pointer(event, This.Svg.node())
      //   This.Svg.append("text").attr('id', 'detail-msg').attr('x', pt[0]).attr('y', pt[1]).text(`X：${parseInt(pt[0])} | Y：${parseInt(pt[1])}`)
      //   // console.log(This.Svg.node())
      //   event.target.setAttribute("stroke-width",  This.x_oneDayPixel*0.7)
      //   console.log(event.target.getAttribute("date"))
      //   window.tt = event.target
      // })
      // d3.selectAll('.money-bar').on('mouseleave', function () {
      //   // let pt = d3.pointer(event, This.Svg.node())
      //   // console.log(This.Svg.node())
      //   document.getElementById("detail-msg").remove()
      //   event.target.setAttribute("stroke-width",  This.x_oneDayPixel*0.5)
      // })
      // document.getElementById("date-bk-area").setAttribute("width",  this.x_oneDayPixel)
      // console.log(this.totalHeightPiexl)
      // document.getElementById("main-svg").setAttribute("viewBox", "0,0,"+this.totalWidthPiexl+","+this.totalHeightPiexl)
      // document.getElementById("main-svg").setAttribute("width",this.total_width-this.y_axis_width)
      // document.getElementById("main-svg").setAttribute("height",this.total_height-this.x_axis_height)
      // document.getElementById("main-svg").setAttribute("viewBox", "0,0,1160,770")

      // document.getElementById("main-svg").setAttribute("width",this.total_width-this.y_axis_width)
      // document.getElementById("main-svg").setAttribute("height",this.total_height-this.x_axis_height)
      document.getElementById("main-svg").setAttribute("preserveAspectRatio","none")
      // document.getElementById("main-svg").setAttribute("width",this.totalWidthPiexl)
      // document.getElementById("main-svg").setAttribute("height",this.totalHeightPiexl)
      // document.getElementById("main-svg").setAttribute("viewBox", "0,0, 100,"+this.totalHeightPiexl)
      // console.log("totalWidthPiexl",this.totalWidthPiexl,"totalHeightPiexl",this.totalHeightPiexl)
      // document.getElementById("main-svg").setAttribute("viewBox", (-this.totalWidthPiexl)+","+(-this.totalHeightPiexl)+","+(this.totalWidthPiexl/2)+","+(this.totalHeightPiexl/2))
      // document.getElementById("main-svg").setAttribute("viewBox", (-this.totalWidthPiexl)+","+(-this.totalHeightPiexl)+","+(this.totalWidthPiexl)+","+(this.totalHeightPiexl))
      // console.log("MinPrice",this.yScale(this.MinPrice),"MaxPrice",this.yScale(this.MaxPrice))
      // console.log("MinDate",this.xScale(this.MinDate),"MaxDate",this.xScale(this.MaxDate))

      // document.getElementById("main-svg").setAttribute("viewBox", 
      //   (this.xScale(this.MinDate))+","+
      //   (this.yScale(this.MaxPrice))+","+
      //   (this.totalWidthPiexl)+","+
      //   ( Math.abs( this.yScale(this.MaxPrice - this.MinPrice) ) )
      // )

      // document.getElementById("main-svg").setAttribute("viewBox", "-11750,-960,1160,770")






      
    },
    //? 初始化股票圖視窗
    INIT__mainSvg() {
      this.Svg = d3.select('#main-svg')

      // var Chart = d3.select('#chart')
      // this.Svg = Chart.append('svg')
      // this.Svg.attr("id", 'main-svg')
      // this.Svg.attr('width', this.total_width-this.y_axis_width).attr('height', this.total_height-this.x_axis_height).attr("id", 'main-svg')
    },
    INIT__YAxisZoom(){
      var test  = (this.getXYPointInSvg(new Date(), this.MeanPrice))[1]-this.total_height/2.
      this.YAxisEvent__VerticalDisplacement(-test)
    },

    //! 五線譜相關
    fiveLine__reflash() {
      if (document.getElementById("five-line")) {
        for (let child of document.getElementById("five-line").childNodes) {
          child.remove()
        }
        this.Svg.select("#five-line").attr('transform', 'translate('+this.XAixsShift+', '+this.x_axis_height+')')
        const g = this.Svg.select("#five-line").append("g")
          .attr("stroke-linecap", "round")
          .attr("stroke", "black")
        .selectAll("g")
        .data(this.fiveLine__plotData)
        .join("g")

        g.append("line")
          .attr("y1", d => this.yScale(d.y1))
          .attr("y2", d => this.yScale(d.y2))
          .attr("x1", d => this.xScale(new Date(d.x1)))
          .attr("x2", d => this.xScale(new Date(d.x2)))
          .attr("class","unselect")
          .attr("stroke",d => d.color)
          .attr("stroke-width", 3)
        

      } else {
        this.Svg.append('g').attr("id","five-line")
      }
    }
  },
  mounted(){
    window.test = this
    
    var This = this
    this.L_allData = Testdata
    for (let dataChose in this.L_allData) {
      this.L_allData[dataChose]["index"] = dataChose
    }
    this.fiveLine__dataStart = this.L_allData.length -1
    // this.y_onePricePixel = (this.total_height-this.x_axis_height)/((this.MaxPrice - this.MinPrice)*1.2)*1.5

    // this.nowX1 = this.MinDate.addDays(-10)
    // this.nowX2 = new Date(this.MaxDate.format("Y-M-d"))
    // this.nowX1 = new Date(this.MaxDate.format("Y-M-d")).addDays(-30)


    this.nowX2 = new Date(this.MinDate.format("Y-M-d")).addDays(20)
    this.nowX1 = new Date(this.MinDate.format("Y-M-d")).addDays(10)

    // this.nowX2 = new Date(2024,1,5)
    // this.nowX1 = new Date(2023,11,1)
    
    this.nowY1 = this.MinPrice*0.9
    this.nowY2 = this.MaxPrice*1.1
    // this.nowY1 = 0
    // this.nowY2 = this.MaxPrice*1.1

    this.INIT__mainSvg()
    // this.createLineAreaEventBK()
    // this.reflashLinePath()
    // this.fiveLine__reflash()
    // this.createYAxisEventBK()
    this.reflashYAxis()
    // this.createXAxisEventBK()
    this.reflashXAxis()
    this.reflashLinePath()
    // this.INIT__YAxisZoom()
    // this.fiveLine__reflash()
    
  }
}
</script>
<style lang="postcss">
/* https://github.com/csstools/postcss-plugins/tree/main/plugins/postcss-nesting */
.unselect {
  user-select: none; 
  pointer-events: none;
}
</style>