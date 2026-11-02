import { _decorator, Enum, EventHandler, Node, Size, Vec2, Vec3 } from 'cc';
import { uiTf } from '../../../NodeUi';
import { Defer } from "../../../../../Scripts/Lib/baseTs/TSBase";
import { GrideLayer, gridHVType, gridWidgetType } from "../CompBase/GrideLayer";
import { SplitGroupBase } from "../CompBase/SplitGroupBase";
import SplitItem from "../CompBase/SplitItem";
import SplitLayer from "../CompBase/SplitLayer";


const { ccclass, property, menu } = _decorator;

interface virsualItem {
    pos: number,
    spItem?: SplitItem,
}
//虚拟网格列表
@ccclass
@menu("ccfwk公共组件/布局/VirsualGrideList")
export class VirsualGrideList extends SplitGroupBase {

    @property({ type: Enum(gridHVType), tooltip: "布局方向" })      //默认纵向对齐
    eHVType: gridHVType = gridHVType.VerType;

    @property({
        type: Enum(gridWidgetType), tooltip: "横向对齐方式", visible: function () {
            if (this.eHVType == gridHVType.VerType) {
                return true;
            }
            else if (this.eHVType == gridHVType.HorType) {
                this.eHorType = gridWidgetType.Top;
                return false;
            }
        }
    })
    eHorType: gridWidgetType = gridWidgetType.Center;  //默认顶部对齐
    @property({
        type: Enum(gridWidgetType), tooltip: "竖向对齐方式", visible: function () {
            if (this.eHVType == gridHVType.VerType) {
                this.eVerType = gridWidgetType.Top;
                return false;
            }
            else if (this.eHVType == gridHVType.HorType) {
                return true;
            }
        }
    })      //默认居中对齐
    eVerType: gridWidgetType = gridWidgetType.Center;


    @property({
        visible: function () {
            if (this.eHVType == gridHVType.VerType)
                return this.eHorType == gridWidgetType.Center ? true : false;
            else if (this.eHVType == gridHVType.HorType)
                return this.eVerType == gridWidgetType.Center ? true : false;
        }, tooltip: "不足整行/整列的情况居中"
    })
    bEndNullCenter: boolean = false

    @property
    bloop: boolean = false

    @property({
        type: EventHandler,
        tooltip: "行列位置变化时触发",
        displayName: "新行刷新"
    })
    moveNewLineFun = new EventHandler();

    mGrideLayer: GrideLayer = null

    modelCover: Array<any> = new Array();

    protected mFillDataLen: number = 0 //填充的个数
    protected mlineDataBegin: number = 0//起始行
    protected mFirstLineStartOff: number = 0 //第一行起始和0的偏移

    protected mLastCoverBeginPos: number = 0
    protected mCoverBeginRaw: number = 0 //开始的位置
    protected grideChildrens: virsualItem[] = []    //子节点
    protected mNeedGrideShowNum: number = 0

    protected mlineMax: number = 0
    protected mCoverWH: Vec2 = new Vec2(1, 1) //遮罩层子节点的横纵数量

    /**@description x表示头部翻转数量，y-x表示正部分数量，z-y表示尾部反向数量*/
    protected mVecCoverData: Vec3 = new Vec3(0, 0, 0)

    protected lineMaxSize = 0
    protected notnullNum = 0


    protected aniDefer: Defer = null
    changeHv(eHv: gridHVType) {
        this.eHVType = eHv
        if (this.eHVType == gridHVType.VerType) {
            this.eHorType = gridWidgetType.Center;
            this.eVerType = gridWidgetType.Top;
        }
        else if (this.eHVType == gridHVType.HorType) {
            this.eHorType = gridWidgetType.Top;
            this.eVerType = gridWidgetType.Center;
        }
        this.mSplitLayer = this.node.getComponent(SplitLayer)
        if (this.mSplitLayer) {
            this.mSplitLayer.removeAllSplitItems()
        }
        this.mGrideLayer = this.node.getComponent(GrideLayer)
        if (this.mGrideLayer) {
            this.mGrideLayer.eHVType = this.eHVType
            this.mGrideLayer.eVerType = this.eVerType
            this.mGrideLayer.eHVType = this.eHVType
        }
        this.resetPos()
    }

    setChildSize(size:Size){
        this.mSplitLayer?.setChildSize(size);
        this.mGrideLayer?.setGridSize(size.width, size.height);
    }


    initComp() {
        this.mGrideLayer = this.node.getComponent(GrideLayer)
        if (!this.mGrideLayer) {
            this.mGrideLayer = this.node.addComponent(GrideLayer)
            this.mGrideLayer.container = this.node
            this.mGrideLayer.eHorType = this.eHorType
            this.mGrideLayer.eVerType = this.eVerType
            this.mGrideLayer.eHVType = this.eHVType
            this.mGrideLayer.bEndNullCenter = this.bEndNullCenter
        }
        this.mSplitLayer = this.node.getComponent(SplitLayer)
        if (!this.mSplitLayer) {
            this.mSplitLayer = this.node.addComponent(SplitLayer)
        }
        this.mSplitLayer.childrenItem = this.childrenItem
        this.mSplitLayer.initContents()
    }

    updateInit() {
        if (!this.model) return;
        this.initComp()
        super.updateInit()
        let sizeItem = this.mSplitLayer.mChildSize
        this.mGrideLayer.setGridSize(sizeItem.width, sizeItem.height)

        let rawNum = this.mGrideLayer.getRawItemNum()
        let endOneOwn = this.model.length % rawNum
        let modelMatchLen = this.model.length
        this.mFillDataLen = 0
        if (endOneOwn != 0) { //数据填充成整行
            this.mFillDataLen = rawNum - endOneOwn
            for (let idx = 0; idx < this.mFillDataLen; ++idx) {
                modelMatchLen++;
            }
        }


        let showNum = this.mGrideLayer.getMatchNum()
        if (modelMatchLen <= showNum && this.mGrideLayer.isMatchFull()) {//范围内能显示完全
            this.mNeedGrideShowNum = showNum
        } else {
            showNum += rawNum //添加一行备份
            this.mNeedGrideShowNum = showNum
        }
        this.mCoverWH.x = rawNum
        this.mCoverWH.y = showNum / this.mCoverWH.x
        this.mlineMax = Math.floor(modelMatchLen / rawNum)
        let cellSize = this.mGrideLayer.getDirCellSize()
        this.lineMaxSize = this.mlineMax * cellSize
        this.notnullNum = 0
        for (let idx = 0; idx < modelMatchLen; ++idx) {
            if (this.model[idx]) this.notnullNum++;
        }

    }




    resetPos() {
        this.mCoverBeginRaw = 0
        this.mFirstLineStartOff = 0
        this.mlineDataBegin = 0
        this.mLastCoverBeginPos = 0
        this.mGrideLayer?.changeStartOffPos(0)//所有节点修改位置
    }

    getPageContentSize() {
        let sizeItem = this.mSplitLayer.mChildSize
        let rawNum = this.mGrideLayer.getRawItemNum()
        let sz = new Size(0, 0)
        if (this.mGrideLayer.eHVType == gridHVType.VerType) {
            sz.width = sizeItem.width * rawNum
            sz.height = this.mlineMax * sizeItem.height
        }
        else {
            sz.height = sizeItem.height * rawNum
            sz.width = this.mlineMax * sizeItem.width
        }
        return sz
    }

    //更新当前节点状态
    updateItemState(curIdx: number, item: virsualItem, bfirst: boolean = false) {
        let spItem = item?.spItem
        let bV = false
        if (this.modelCover[curIdx] && spItem) {
            bV = true
            if (this.bloop == false) {
                if (curIdx < this.mVecCoverData.x || curIdx >= this.mVecCoverData.y) 
                    bV = false
            }
            spItem.setModel(this.modelCover[curIdx])
        }
        return bV
    }

    async updateItemListSet() {
        let self = this

        let exOper = self.mNeedGrideShowNum - self.mSplitLayer.listItems.length
        let needwaitAllOverFun: boolean = self.showZdyEnterAni ? true : false
        if (needwaitAllOverFun) {
            if (exOper !== 0 || !self.mDeferAniEnter.able) {//数据数量没变动，或者动画被清空
                self.showAniNodes = new Set()
                self.grideChildrens = []
                for (let idx = 0; idx < self.mNeedGrideShowNum; ++idx) {
                    let item: virsualItem = {
                        spItem: null,
                        pos: idx
                    }
                    self.grideChildrens.push(item)
                }
                self.resetAniDefer()
                self.mSplitLayer.removeAllSplitItems()
                self.mSplitLayer.addChildByNum(self.mNeedGrideShowNum, self.onceItemNum, async (idx: number, itemSp: SplitItem) => {
                    //当前操作，gride位置可能变化了，所以再寻找下
                    let findIdx = -1
                    for (let ndx = 0; ndx < self.grideChildrens.length; ++ndx) {
                        if (self.grideChildrens[ndx].pos == idx) {
                            if (self.grideChildrens[ndx].spItem) {
                                console.error("虚拟列表创建子节点序号错误，当前位置节点非空")
                            }
                            self.grideChildrens[ndx].spItem = itemSp
                            findIdx = ndx
                            break;
                        }
                    }
                    if (findIdx >= 0) {
                        itemSp.setKeyIdx(idx)
                        let bv = self.updateItemState(findIdx, self.grideChildrens[findIdx], true)
                        if (bv) {
                            self.showAniNodes.add(itemSp.node as Node)
                            itemSp.setSplitActive(false)
                        } else {
                            itemSp.setSplitActive(false)
                        }
                        self.mGrideLayer.onUpdateItemPos(itemSp.node, findIdx, self.notnullNum - 1)
                        if (self.mNeedGrideShowNum == idx + 1) {
                            self.loadOverCall.forEach((eleFun) => {
                                eleFun()
                            })
                            self.showListAniEnter()
                        }
                    }
                })
                await self.mDeferAniEnter.promise;
                return;
            } else {//显示数量不变
                await self.mDeferAniEnter.promise;
                if (self.node.isValid) {
                    for (let idx = 0; idx < self.mNeedGrideShowNum; ++idx) {
                        let bv = self.updateItemState(idx, self.grideChildrens[idx], true)
                        let itemSp = self.grideChildrens[idx]?.spItem
                        itemSp?.setSplitActive(bv)
                    }
                }
            }
        } else {
            if (exOper == 0) {
                for (let idx = 0; idx < self.mNeedGrideShowNum; ++idx) {
                    let bv = self.updateItemState(idx, self.grideChildrens[idx], true)
                    let itemSp = self.grideChildrens[idx].spItem
                    itemSp.setSplitActive(bv)
                }
                self.mDeferAniEnter.resolve(true)
                return;
            }
            self.grideChildrens = []
            for (let idx = 0; idx < self.mNeedGrideShowNum; ++idx) {
                let item: virsualItem = {
                    spItem: null,
                    pos: idx
                }
                self.grideChildrens.push(item)
            }
            self.mSplitLayer.addChildByNum(self.mNeedGrideShowNum, self.onceItemNum, async (idx: number, itemSp: SplitItem) => {
                //当前操作，gride位置可能变化了，所以再寻找下
                let findIdx = -1
                for (let ndx = 0; ndx < self.grideChildrens.length; ++ndx) {
                    if (self.grideChildrens[ndx].pos == idx) {
                        if (self.grideChildrens[ndx].spItem) {
                            console.error("虚拟列表创建子节点序号错误，当前位置节点非空")
                        }
                        self.grideChildrens[ndx].spItem = itemSp
                        findIdx = ndx
                        break;
                    }
                }
                if (findIdx >= 0) {
                    itemSp.setKeyIdx(idx)
                    let bv = self.updateItemState(findIdx, self.grideChildrens[findIdx], true)
                    itemSp.setSplitActive(bv)
                    self.mGrideLayer.onUpdateItemPos(itemSp.node, findIdx, self.notnullNum - 1)
                    if (self.mNeedGrideShowNum == idx + 1) {
                        self.loadOverCall.forEach((eleFun) => {
                            eleFun()
                        })
                        self.mDeferAniEnter.resolve(true)
                    }
                }

            })
        }
    }

    updateModel() {
        if (!this.node.activeInHierarchy || !this.model) return;
        if (this.model.length == 0) {
            this.showAniNodes = new Set()
            this.grideChildrens = []
            this.mSplitLayer.removeAllSplitItems()
            this.resetAniDefer()
            if (this.showListAniEnter) this.showListAniEnter()
            return;
        }

        this.changeCoverArray()
        this.updateItemListSet()
        // this.mGrideLayer.changeStartOffPos(this.mFirstLineStartOff)
        // this.updateAllItemPos()
    }

    //获取覆盖部分数据
    changeCoverArray() {
        this.modelCover = []

        if (!this.model) return;
        let beginIdx = 0
        if (this.mlineDataBegin < 0) {//尾部反向填到前面
            let maxLine = this.mCoverWH.y
            if (this.mlineDataBegin + this.mCoverWH.y > 0) {//并非都是负部分
                maxLine = -this.mlineDataBegin
            }

            for (let idx = 0; idx < maxLine; ++idx) {//列翻转
                let lineIdx = this.mlineMax + this.mlineDataBegin + idx
                for (let x = 0; x < this.mCoverWH.x; ++x) {
                    this.modelCover.push(this.model[lineIdx * this.mCoverWH.x + x])
                }
            }
            this.mVecCoverData.x = this.modelCover.length
            beginIdx = 0
            let leftLine = this.mCoverWH.y - maxLine
            //填充正的部分
            for (let idx = 0; idx < leftLine; ++idx) {
                for (let x = 0; x < this.mCoverWH.x; ++x) {
                    this.modelCover.push(this.model[idx * this.mCoverWH.x + x])
                }
            }
            this.mVecCoverData.y = this.modelCover.length
            this.mVecCoverData.z = this.modelCover.length
        }
        else {
            let maxLine = this.mCoverWH.y
            if (this.mlineMax - this.mCoverWH.y < this.mlineDataBegin) {//并非都是正部分
                maxLine = this.mlineMax - this.mlineDataBegin
            }
            this.mVecCoverData.x = 0
            beginIdx = this.mlineDataBegin * this.mCoverWH.x
            //填充正的部分         
            for (let idx = 0; idx < maxLine; ++idx) {
                let lineIdx = this.mlineDataBegin + idx
                for (let x = 0; x < this.mCoverWH.x; ++x) {
                    this.modelCover.push(this.model[lineIdx * this.mCoverWH.x + x])
                }
            }
            this.mVecCoverData.y = this.modelCover.length
            let leftLine = this.mCoverWH.y - maxLine

            for (let idx = 0; idx < leftLine; ++idx) {//列翻转
                for (let x = 0; x < this.mCoverWH.x; ++x) {
                    this.modelCover.push(this.model[idx * this.mCoverWH.x + x])
                }
            }
            this.mVecCoverData.z = this.modelCover.length
        }
    }

    //dir=1表示往下，dir=-1表示往上
    protected onChangeOneRawPos(dir: number, changeline: number) {
        if (dir == 0) return

        let rawNum = this.mGrideLayer.getRawItemNum()
        let upRawItems = []
        let ableVNum = this.mNeedGrideShowNum - rawNum
        if (changeline < this.mCoverWH.y) { //整页更新
            for (let m = 0; m < changeline; ++m) {
                if (dir > 0)//往上变化
                {
                    upRawItems = this.grideChildrens.splice(0, rawNum)
                    this.grideChildrens = this.grideChildrens.concat(upRawItems)  //上面的移动到下面去            
                }
                else {//往下变化
                    upRawItems = this.grideChildrens.splice(ableVNum, rawNum)
                    this.grideChildrens = upRawItems.concat(this.grideChildrens) //下面的移动到上面去
                }
            }
        }
        for (let idx = 0; idx < this.grideChildrens.length; ++idx) {
            let spItem = this.grideChildrens[idx].spItem as SplitItem
            if (spItem instanceof SplitItem) {
                let bV = this.updateItemState(idx, this.grideChildrens[idx])
                spItem.setSplitActive(bV)
            }
        }
        if (this.moveNewLineFun)
            this.moveNewLineFun.emit([this.mlineDataBegin, this.mFirstLineStartOff])
    }

    updateAllItemPos() {
        //更新子节点位置
        for (let idx = 0; idx < this.grideChildrens.length; ++idx) {
            let itemSp = this.grideChildrens[idx].spItem
            if (itemSp)
                this.mGrideLayer.onUpdateItemPos(itemSp.node, idx, this.notnullNum - 1)
        }
    }

    //刷新子节点
    onChangeStartPos(coverBeginPos: number = 0) {
        let cellSize = this.mGrideLayer.getDirCellSize()
        let lastLine = this.mlineDataBegin
        let lastOff = this.mFirstLineStartOff

        if (!this.mDeferAniEnter.promise.isResoledOrRejected()) return;//动画出现完成

        if (this.lineMaxSize == 0) return false
        let matchNum = this.mGrideLayer.getMatchNum()
        let fullNum = this.mGrideLayer.getFullNum()
        if (fullNum >= this.model.length) {//一页内部能显示完全，不能滑动
            this.updateAllItemPos()
            return true
        }


        let dir = coverBeginPos - this.mLastCoverBeginPos
        //如果总大小时300，给的targetoff时-900，那么从0开始计算        
        this.mLastCoverBeginPos = coverBeginPos

        if (!this.bloop && coverBeginPos < 0) {
            // 非循环列表顶部越界时保持首行，只移动布局，不能把负偏移取绝对值后翻到后续行。
            this.mlineDataBegin = 0
            this.mFirstLineStartOff = coverBeginPos
        }
        else if (coverBeginPos >= 0) {
            if (this.bloop) {
                coverBeginPos = coverBeginPos % this.lineMaxSize
            } else {
                coverBeginPos = Math.min(coverBeginPos, this.lineMaxSize)
            }
            if (matchNum == this.model.length) {
                this.mlineDataBegin = 0
                this.mFirstLineStartOff = coverBeginPos
            }
            else {
                const lineBegin = Math.floor(coverBeginPos / cellSize)
                this.mlineDataBegin = Math.min(lineBegin, this.mlineMax - 1)
                this.mFirstLineStartOff = coverBeginPos - lineBegin * cellSize
            }
        }
        else {
            let absPos = -coverBeginPos
            if (this.bloop) {
                let pageNum = Math.floor(absPos / this.lineMaxSize)
                coverBeginPos = absPos - pageNum * this.lineMaxSize
            } else {
                coverBeginPos = Math.min(absPos, this.lineMaxSize)
            }
            if (matchNum == this.model.length) {
                this.mlineDataBegin = 0
                this.mFirstLineStartOff = -coverBeginPos
            }
            else {
                const lineBegin = Math.floor(coverBeginPos / cellSize)
                this.mlineDataBegin = Math.min(lineBegin, this.mlineMax - 1)
                this.mFirstLineStartOff = coverBeginPos - lineBegin * cellSize
            }
        }
        if (this.mGrideLayer.eHVType == gridHVType.HorType) this.mFirstLineStartOff *= -1

        if (lastLine != this.mlineDataBegin) {// && coverBeginPos!=0){ //converBeginPos==0的情况下存在刷新不出来的异常，所以去掉这个判断2023-1-17，当初是为了减少刷新频率
            this.changeCoverArray()
            let offLine = Math.abs(this.mlineDataBegin - lastLine)
            this.onChangeOneRawPos(dir, offLine)
        }

        ///////////////////////////////////////////////////////////////////////        
        this.mGrideLayer.changeStartOffPos(this.mFirstLineStartOff)//所有节点修改位置
        this.updateAllItemPos()
        return true
    }
}