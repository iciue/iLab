/**
 * 用来存储世界中的坐标对
 * @class Vector
 */
class Vector {
  constructor(x, y) {
    this.x = x
    this.y = y
  }

  plus(other) {
    return new Vector(this.x + other.x, this.y + other.y)
  }
}

/**
 * 网格, 网格虽然是世界对象的一部分, 但为了简化世界对象的复杂度, 我们将其抽离出来作为独立的对象来处理
 * 网格处理网格自身及其相关的事情
 * 使用一维数组来表示网格, 数组的长度是世界网格高和宽的乘积, 其中心点(x, y) 处的索引为 (x + y * width)
 * @class grid
 */
class Grid {
  constructor(width, height) {
    this.space = new Array(width * height)
    this.width = width
    this.height = height
  }

  isInside(vector) {
    return vector.x >= 0 && vector.x <= this.width && vector.y >= 0 && vector.y <= this.height
  }

  get(vector) {
    return this.space[vector.x + this.width * vector.y]
  }

  set(vector, val) {
    return this.space[vector.x + this.width * vector.y] = val
  }

}

/**
 * @class View
 * @method look 接受一个坐标参数, 返回该方向所对应的字符串格式的坐标偏移量. 如果该方向对应的方向上是一堵墙, 则返回 "#", 如果为空则返回 " "
 * @method find 接受一个参数,代表地图元素的字符串. 返回动物身边对应方格的方向
 * @method findAll 接受参数为 代表地图元素的字符串, 返回一个数组代表身边所有对应的方格的方向 [ne, e, se]
 */
class View {
  constructor(word, vector) {
    this.word = word
    this.vector = vector
  }
  look(dir) {
    let target = this.vector.plus(directions[dir])
    if (this.word.grid.isInside(target)) {
      return charFromElement(this.word.grid.get(target))
    }
    return '#'
  }

  findAll(ch) {
    let found = []
    for (let dir in directions) {
      if (this.look(dir) === ch) found.push(dir)
    }
    return found
  }

  find(ch) {
    let found = this.findAll(ch)
    if (found.length === 0) return null
    return randomElement(found)
  }
}

/**
 * Word 对象接受两个参数
 * @class Word
 * @param grid 表示网格的字符串数组
 * @param legend 图例对象, 表示世界中每个字符的含义, 注意每个字符同时也是一个对象, (除了空格字符, 空格字符总是指向 null)
 */
class Word {
  constructor(map, legend) {
    this.grid = new Grid(map[0].length, map.length)
    this.legend = legend

    map.forEach((line, y) => { // 如果这里不用箭头函数, 则 this 会指向全局哦 
      for (let x = 0; x < line.length; x++) {
        this.grid.set(new Vector(x, y), elementFromChar(legend, line[x]))
      }
    });
  }

  /**
   * 根据世界的状态生成一个类似地图的字符串
   * @memberof Word
   */
  toString() {
    let output = ""
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        let element = this.grid.get(new Vector(x, y))
        output += charFromElement(element)
      }
      output += "\n"
    }
    return output
  }

  /**
   * 小动物可以在 turn 时执行一次动作, turn 会遍历网格中的所有元素,查找包含的 act 方法的对象
   * 找到某个对象时, 会调用其 act 方法获取一个动作对象, 如果动作有效则执行.
   * 如果动物执行了动作后恰好移动到了未遍历的坐标, 则我们遍历时还会第二次执行 act, 所以: 创建一个数组存储所有已经执行过 act 的小动物
   * @memberof Word
   */
  turn() {
    let acted = []
    this.forEach((el, vector) => {
      if (el.act && !acted.includes(el)) {
        this.letAct(el, vector)
        acted.push(el)
      }
    })
  }

  letAct(critter, vector) {
    let action = critter.act(new View(this, vector))
    // console.log(critter, action);

    let handed = action && action.type in actionsTypes && actionsTypes[action.type].call(this, critter, vector, action)
    // console.log(handed);

    if (!handed) {
      critter.energy -= 0.2
      if (critter.energy <= 0) {
        this.grid.set(vector, null)
      }
    }

  }

  checkDestination(action, vector) {
    if (directions.hasOwnProperty(action.direction)) {
      let dest = vector.plus(directions[action.direction])
      if (this.grid.isInside(dest)) return dest
    }
  }

  // 遍历每一个格子, 并执行回调函数(传参为格子上的值, 坐标)
  forEach(f) {
    for (let y = 0; y < this.grid.height; y++) {
      for (let x = 0; x < this.grid.width; x++) {
        let value = this.grid.space[x + y * this.grid.width]
        if (value !== null) f.call(this, value, new Vector(x, y))
      }
    }
  }
}

/**
 * 墙壁是一个简单的方法, 没有 act 属性. 只在世界中占据空间
 */
class Wall {
  constructor() {}
}

class WallFollower {
  constructor() {
    this.dir = 's'
  }

  act(view) {
    let start = this.dir // 面向南
    // 左后方(东北)不为空则代表没有贴墙
    if (view.look(dirPlus(this.dir, -3)) !== ' ') {
      start = this.dir = dirPlus(this.dir, -2) // 面向左侧(e)
    }
    // ? 为啥先判断左后方为空?
    // 如果面向方向不为空, 则顺时针转身
    while (view.look(this.dir) !== ' ') {
      this.dir = dirPlus(this.dir, 1)
      if (this.dir === start) break
    }
    return {
      type: 'move',
      direction: this.dir
    }
  }
}

class BouncingCritter {
  constructor() {
    this.direction = randomElement(directionNames)
  }

  act(view) {
    if (view.look(this.direction) !== " ") {
      this.direction = view.find(" ") || "s";
    }
    return {
      type: "move",
      direction: this.direction
    }
  }
}

class Plant {
  constructor() {
    this.energy = 3 + Math.random() * 8
  }
  act(ctx) {
    if (this.energy > 15) {
      let space = ctx.find(' ')
      if (space) return {
        type: 'reproduce',
        direction: space
      }
    }
    if (this.energy < 20) return {
      type: 'grow',
    }
  }
}

class PlantEater {
  constructor() {
    this.energy = 20
  }
  act(ctx) {
    let space = ctx.find(' ')
    let plant = ctx.find('*')
    if (this.energy > 60 && space) return {
      type: 'reproduce',
      direction: space
    }
    if (plant) return {
      type: 'eat',
      direction: plant,
    }
    if (space) return {
      type: 'move',
      direction: space,
    }
  }
}

const actionsTypes = Object.create(null)
actionsTypes.grow = function (critter) {
  critter.energy += 0.5
  return true
}
actionsTypes.move = function (critter, vector, action) {
  let dest = this.checkDestination(action, vector)
  if (dest == null || critter.energy <= 1 || this.grid.get(dest) !== null) {
    return false
  }
  critter.energy -= 1
  this.grid.set(vector, null)
  this.grid.set(dest, critter)
  return true
}
actionsTypes.eat = function (critter, vector, action) {
  let dest = this.checkDestination(action, vector)
  let atDest = dest !== null && this.grid.get(dest)
  if (!atDest || atDest.energy === null) return false
  critter.energy += atDest.energy
  this.grid.set(dest, null)
  return true
}
actionsTypes.reproduce = function (critter, vector, action) {
  let baby = elementFromChar(this.legend, critter.originChar)
  let dest = this.checkDestination(action, vector)
  if (dest === null || critter.energy <= baby.energy * 2 || this.grid.get(dest) !== null) return false

  critter.energy -= baby.energy * 2
  this.grid.set(dest, baby)
  return true
}

/**
 * 让初始方位进行偏移
 * @param {*} direction 初始方位
 * @param {*} skew 偏移量, 1 代表顺时针 45 度
 * @returns {*} 偏移后的方位
 */
function dirPlus(dir, skew) {
  let idx = directionNames.indexOf(dir)
  return directionNames[(idx + skew + 8) % 8]
}

// 表示方位, 北 东北 东 东南 南 西南 西 西北
const directions = {
  "n": new Vector(0, -1),
  "ne": new Vector(1, -1),
  "e": new Vector(1, 0),
  "se": new Vector(1, 1),
  "s": new Vector(0, 1),
  "sw": new Vector(-1, 1),
  "w": new Vector(-1, 0),
  "nw": new Vector(-1, -1),
}
const directionNames = "n ne e se s sw w nw".split(' ')


/**
 * @param {Array} ary
 * @returns  从参数数组中的一个随机值
 */
function randomElement(ary) {
  return ary[~~(Math.random() * ary.length)]
}

/**
 * 查找字符对应的构造函数, 初始化一个对应的实例, 并添加 originChar 属性(方便找出创建元素时使用的字符) 然后返回
 * @param {Array} legend
 * @param {string} ch
 * @returns {object} 
 */
function elementFromChar(legend, ch) {
  if (ch === ' ') return null
  let element = new legend[ch]()
  element.originChar = ch
  return element
}

/**
 * @param {object} legend 的实例
 * @returns {string} 构建实例时使用的字符
 */
function charFromElement(element) {
  if (element === null) return " "
  return element.originChar
}


const plan = ["############################",
  "#     #    *   #    * o    ##",
  "#    ***                   #",
  "#  *       ##**#      **  *#",
  "##  *   #      #     #    ##",
  "##   * ##     ##           #",
  "#  *      ##     *    ##   #",
  "#  *  ##***    ** **       #",
  "#    ##     **   o         #",
  "# o   #        o    ##     #",
  "#     #   **     **        #",
  "############################"
]
let word = new Word(plan, {
  "#": Wall,
  "o": PlantEater,
  "*": Plant
})

console.log(word.toString());
for (let i = 0; i < 1000; i++) {
  word.turn()
}
console.log(word.toString())