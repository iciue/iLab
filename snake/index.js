class Snake {
  constructor(wrap, opts) {
    this.board = wrap

    this.width = opts.width
    this.height = opts.height
    this.cellSize = opts.cellSize || 20
    this.data = Array(this.height).fill(0).map(_ => Array(this.width).fill(0)) // 游戏状态, 0空格, 1蛇身, 2蛇头, 3苹果

    this.snakeDir = 'up' // 蛇头朝向
    this.snakeHeadPos = null // 蛇头位置
    this.snakeLength = 0 // 蛇身长度
    this.snakeBody = [] // 蛇身的坐标集

    this.init()
  }

  init() {

    this.paintBoard() // 遍历 this.data 渲染 DOM
    this.generateSnakeHead()
    this.generateApple()
  }

  paintBoard() {
    const background = elt('table', 'background')
    background.style.width = this.width * this.cellSize + 'px'
    background.style.height = this.height * this.cellSize + 'px'
    this.data.forEach((row, rowIdx) => {
      const tr = elt('tr', 'row')
      tr.setAttribute('data-row', rowIdx)
      row.forEach((col, colIdx) => {
        const td = elt('td', 'cell')
        td.setAttribute('data-col', colIdx)
        tr.appendChild(td)
      })
      background.appendChild(tr)
    })
    this.board.appendChild(background)
  }

  generateSnakeHead() {
    const [centerRow, centerCol] = [~~(this.height / 2), ~~(this.width / 2)]
    const distance = 5 // 蛇头在 中心点5个格子内随机生成
    const row = ~~getRandomNumber(centerRow - distance, centerRow + distance + 1)
    const col = ~~getRandomNumber(centerCol - distance, centerCol + distance + 1)

    this.data[row][col] = 2
    this.snakeHeadPos = [row, col]

    const cell = this.findCell(row, col)
    cell.classList.add('snake-head')
  }

  generateApple() {
    let row = ~~getRandomNumber(0, this.height)
    let col = ~~getRandomNumber(0, this.width)

    while (this.data[row][col] !== 0) {
      row = ~~getRandomNumber(0, this.height)
      col = ~~getRandomNumber(0, this.width)
    }

    this.data[row][col] = 3
    const cell = this.findCell(row, col)
    cell.classList.add('apple')
  }

  next(newDir) {
    this.findCell(...this.snakeHeadPos).classList.remove(this.snakeDir)            // 删除蛇头方向
    if (this.isValidDir(newDir, this.snakeDir)) {                                  // 如果新方向是蛇头朝向的反面, 则为无效方位
      this.snakeDir = newDir
    }     
    const nextPosVector = this.getVector(this.snakeDir, this.snakeHeadPos)         // 下个位置的坐标
    if (!this.isWall(nextPosVector)) {                                             // 如果下个位置是 墙体, 游戏结束
      this.findCell(...this.snakeHeadPos).classList.add(newDir)                    // 更新蛇头方向 摆正游戏结束后蛇头的位置
      return this.gameOver() 
    }                

    this.findCell(...nextPosVector).classList.add(this.snakeDir)                   // 更新蛇头方向
    const nextPosEl = this.helper(...nextPosVector)                                // 下个坐标上的元素

    switch (nextPosEl) {
      case 1: // 蛇身
        return this.gameOver()
        break;

      case 3: // 苹果 
        this.move(nextPosVector, true)
        break;

      default: // 空
        this.move(nextPosVector)
        break;
    }
  }

  move(nextPosVector, eat = false) {
    const oldHeadPos = this.snakeHeadPos
    const currCell = this.findCell(...this.snakeHeadPos)
    const nextCell = this.findCell(...nextPosVector)

    // 移动蛇头
    this.helper(...this.snakeHeadPos, 0)
    this.helper(...nextPosVector, 2)
    this.snakeHeadPos = nextPosVector
    currCell.classList.remove('snake-head')
    nextCell.classList.add('snake-head')

    // 移动蛇身
    this.helper(...oldHeadPos, 1) 
    this.snakeBody.unshift(oldHeadPos) 
    currCell.classList.add('snake-body')

    if (eat) {                                                   // 吃到苹果 
      nextCell.classList.remove('apple')                         // 移除苹果
      this.generateApple()                                       // 添加新苹果
    } else {                                                     // 没有吃到苹果, 需要删除蛇尾
      if (this.snakeBody.length) {
        const lastPos = this.snakeBody.pop()                     // 蛇尾的坐标
        this.helper(...lastPos, 0)                               // 蛇尾的坐标重置为空
        this.findCell(...lastPos).classList.remove('snake-body') // 删除DOM 上的蛇尾
      }
    }
  }

  isWall(vector) {
    const [row, col] = vector
    if (row < 0 || row >= this.height) return false
    if (col < 0 || col >= this.width) return false
    return true
  }

  gameOver() {
    console.log('end')
    return 'end'
  }

  isValidDir(newDir, oldDir) {
    if (newDir === 'up') return oldDir !== 'down'
    if (newDir === 'down') return oldDir !== 'up'
    if (newDir === 'left') return oldDir !== 'right'
    if (newDir === 'right') return oldDir !== 'left'
  }

  getVector(dir, pos) {
    let row, col
    switch (dir) {
      case 'up':
        row = pos[0] - 1
        col = pos[1]
        break;

      case 'down':
        row = pos[0] + 1
        col = pos[1]
        break;

      case 'left':
        row = pos[0]
        col = pos[1] - 1
        break;

      case 'right':
        row = pos[0]
        col = pos[1] + 1
        break;
    }
    return [row, col]
  }

  findCell(row, col) { // 根据坐标找到节点
    const tr = this.board.querySelector(`tr[data-row="${row}"]`)
    const td = tr.querySelector(`td[data-col="${col}"]`)
    return td
  }

  /**
   * 获取或设置属性值, 如果 没有传入 data 则返回对应坐标的属性值. 如果有则将其设置为 data
   * @param {*} row
   * @param {*} col
   * @param {*} data
   */
  helper(row, col, data) {
    if (data !== void 0) {
      this.data[row][col] = data
    } else {
      return this.data[row][col]
    }
  }
}

function elt(tagName, className) {
  const newNode = document.createElement(tagName)
  newNode.className = className
  return newNode
}

/**
 * 获取随机数, 范围为 [min, max)
 * @param {number} [min=0]
 * @param {number} [max=1]
 */
function getRandomNumber(min = 0, max = 1) {
  return (Math.random() * (max - min)) + min
}

/**
 * 用 span 元素表示每个方格
 * 用 绿色表示蛇身, 黄色表示蛇头
 * 每次游戏的状态更新, 渲染所有视图.
 */