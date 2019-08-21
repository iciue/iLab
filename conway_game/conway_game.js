// TODO: 稳定状态或 plain 为空时重置蓝图
// TODO: 为点击事件添加节流

class ConwayGame {
  constructor(wrap, plain, opts = {}) {
    this.wrap = wrap
    this.gameBoard = this.wrap.appendChild(elt('div', 'conway-board'))
    this.plain = plain
    this.width = this.plain[0].length
    this.height = this.plain.length
    this.hasBtn = opts.hasBtn || true
    this.autoPlay = opts.autoPlay || false
    this.duration = opts.duration || 500
    
    this.hasBtn && this.createBtn()
    this.autoPlay ? this.startPlay(true) : this.startPlay()
    this.paintMap()
  }

  next() {
    const copy = this.plain.slice() // 记录需要变动的格子方位(不改变原始格子)
    for (let x = 0; x < this.height; x++) {
      for (let y = 0; y < this.width; y++) {
        const neighborNum = this.countNeighbor(x, y)
        if (copy[x][y] === 0) { // 对死去的小格子
          copy[x][y] = neighborNum === 3 ? 1 : 0 // 判断邻居数量是否为 3
        } else if (copy[x][y] === 1) { // 对于活着的小格子
          copy[x][y] = neighborNum > 3 || neighborNum < 2 ? 0 : 1 // 判断邻居数量是否大于 3 或小于 2(死亡)
        }
      }
      this.plain = copy // 替换格子内容
      this.paintMap()

    }
  }

  paintMap() {
    if (this.gameBoard.children.length !== 0) this.clear() // 如果已有子节点则清空
    const frag = document.createDocumentFragment()
    const arr = this.plain
    for (let x = 0; x < arr.length; x++) {
      for (let y = 0; y < arr[x].length; y++) {
        const className = arr[x][y] === 0 ? 'conway-item dead' : 'conway-item life'
        frag.appendChild(elt('p', className))
      }
    }
    this.gameBoard.appendChild(frag)
  }

  clear() {
    while (this.gameBoard.children.length) {
      this.gameBoard.removeChild(this.gameBoard.children[0])
    }
  }

  countNeighbor(x, y) { // 计算邻居的数量, 左 右 上 下 斜对角 共 8 个方位
    let count = 0
    const dirs = {
      up: [x, y - 1],
      down: [x, y + 1],
      left: [x - 1, y],
      leftUp: [x - 1, y - 1],
      leftDown: [x - 1, y + 1],
      right: [x + 1, y],
      rightUp: [x + 1, y - 1],
      rightDown: [x + 1, y + 1],
    }

    for (const dir in dirs) {
      if (dirs.hasOwnProperty(dir)) {
        const [x, y] = dirs[dir]

        if (x >= 0 && y >= 0 && x < this.height && y < this.width) { // 保证方位合法
          if (this.plain[x][y] === 1) count++
        }
      }
    }
    return count
  }

  createBtn() {
    const btn = elt('button', 'control next', 'next')
    btn.addEventListener('click', this.next.bind(this))
    this.wrap.appendChild(btn)
  }

  startPlay(autoPlay) {
    if (autoPlay) {
      this.timer = setInterval(this.next.bind(this), this.duration)
    }
    const stop = elt('button', 'control autoplay', autoPlay ? 'stop' : 'continue')
    this.wrap.appendChild(stop)
    stop.addEventListener('click', (e) => {
      if (e.target.textContent === 'stop') {
        clearInterval(this.timer)
        e.target.textContent = 'continue'
      } else {
        this.timer = setInterval(this.next.bind(this), this.duration)
        e.target.textContent = 'stop'
      }
    })
  }

}

function elt(tagName, className, content) {
  const newNode = document.createElement(tagName)
  newNode.className = className
  if (content) newNode.textContent = content
  return newNode
}