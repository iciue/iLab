class Todo {
  constructor(wrap) {
    this.wrap = wrap
    this.select = this.wrap.querySelector('.select-btn')
    this.input = this.wrap.querySelector('.todo-header input')
    this.contentBox = this.wrap.querySelector('.todo-content ul')
    this.footer = this.wrap.querySelector('.todo-footer')
    this.count = this.footer.querySelector('.count')
    this.items = []
    this.activeAll = false
    this.activeLength = 0

    this.init()
  }

  init() {
    this.input.addEventListener('change', this.addItem.bind(this))         // 添加 item
    this.select.addEventListener('click', this.toggleAll.bind(this))       // 全选/取消全选
    this.contentBox.addEventListener('dblclick', this.editItem.bind(this)) // 双击 span 元素时, li 标签添加一个 input 元素作为编辑框
    this.contentBox.addEventListener('click', this.operateItem.bind(this)) // 单击时, 设置item为完成状态或删除 item
    this.footer.addEventListener('click', this.footerHandler.bind(this))   // 底部按钮, 切换显示项, 清除已完成的 item
  }


  addItem(e) {
    const  value = e.target.value.trim() // 去除首尾空格
    if (!value.length) return            // 输入了空字符串直接 return
    const item = {
      value,
      status: false,                     // false 表示 item 未完成(active). true 表示 item 已完成(completed)
      id: ~~(Math.random() * 100000)     // 标识 item
    }
    e.target.value = ''
    this.items.push(item)                // 操作数据
    this.addDOMItem(item)                // 操作 DOM
    this.updateCount(this.activeLength++)
  }

  addDOMItem(item) {                                          // 增加 li 节点, 及其子节点
    const li = elt('li', 'todo-item', false, {
      'data-id': item.id
    })

    const checkbox = elt('div', 'controller toggle')                 // 切换 item 状态按钮

    const deleteBtn = elt('button', 'controller delete', 'X')        // 删除按钮

    const span = elt('span', '', item.value)

    li.appendChild(checkbox)
    li.appendChild(span)
    li.appendChild(deleteBtn)

    this.contentBox.appendChild(li)
  }

  editItem(e) {
    if (e.target.nodeName === 'SPAN') {                  // 双击 span 元素时, li 标签添加一个 input 元素作为编辑框
      const {parent, item} = this.getItem(e.target)      // 获取父节点 li 和相对应的 item
      const input = elt('input', 'edit', false, {        // 生成 input 标签
        'autofocus': 'true'                              // 修正双击时的全选状态
      }) 
      input.value = item.value                           // 修改数据
      parent.appendChild(input)                          // 修改 DOM
      input.addEventListener('change', this.changeItem.bind(this, parent, item)) 
    }
  }

  changeItem(parent, item, e) {                         // 修改对应 item 的数据, 更新 span 标签的内容
    const newVal = e.target.value.trim()                //  去除首尾空格
    if (newVal.length === 0)  { this.remove(parent, item)}                       // 删除节点
    if (newVal !== item.value) {
      item.value = newVal                               // 更新数据
      parent.querySelector('span').textContent = newVal // 更新 span 标签的内容为更新后的 item 值
    }
    parent.removeChild(e.target)                        // 删除 input
  }

  operateItem(e) {
    const { parent, item } = this.getItem(e.target)          // 获取父节点 li 和相对应的 item

    if (e.target.nodeName === 'DIV') {                       // 切换 item 的状态
      item.status = !item.status
      item.status ? parent.classList.add('completed') : parent.classList.remove('completed')
      item.status ? this.updateCount(this.activeLength--) :this.updateCount(this.activeLength++)
    } else if (e.target.nodeName === 'BUTTON') {             // 删除 item
      this.remove(parent, item)
    }
  }

  remove(parent, item) {                                   // 删除节点
    const idx = this.items.indexOf(item)
    this.items.splice(idx, 1) 
    parent.remove()
    if(!item.status) this.updateCount(this.activeLength--) // 更新 item left 值
  }

  toggleAll() {
    if (this.items.length === 0) return;
    this.activeAll = !this.activeAll        // 切换全选状态
    this.items.forEach(it => {             
      it.status = this.activeAll            // 更新每个 item 的状态
    })
    const list = this.contentBox.children
    for (let i = 0; i < list.length; i++) { // 根据 this.activeAll 的值修改 每一项 item 的 class
      if (this.activeAll) {
        list[i].classList.add('completed')
        this.activeLength = 0
        this.updateCount()
      } else {
        this.activeLength = this.items.length
        this.updateCount()
        list[i].classList.remove('completed')
      }
    }

  }

  footerHandler(e) {
    // 根据 点击位置 切换容器的样式
    switch (e.target.className) {
      case 'clear-completed':
        this.deleteCompleted()
        break;

      case 'all':
        this.contentBox.className = 'show-all'
        break;

      case 'active':
        this.contentBox.className = 'show-active'
        break;

      case 'completed':
        this.contentBox.className = 'show-completed'
        break;
    }

  }

  deleteCompleted() {                    // 删除所有已完成的 item
    const newItems = []
    this.items.forEach((item, idx) => {
      if (item.status) {    
        const tmp = this.contentBox.querySelector(`[data-id="${item.id+''}"]`)
        this.contentBox.removeChild(tmp) // 删除 DOM
      } else {           
        newItems.push(item)              // 保留到新 items
      }
    })
    this.items = newItems
  }

  updateCount() {
    this.count.textContent = this.activeLength + ' items left'
  }

  getItem(node) {
    const ret = {}
    ret.parent = node.parentNode // 获取当前 li 元素
    const id = ret.parent.getAttribute('data-id')
    ret.item = this.items.find(item => item.id === +id)
    return ret
  }
}


/**
 * 根据参数创建节点
 * @param {string} tagName 标签名
 * @param {string} className 类名
 * @param {string} content 节点的 textContent 属性
 * @param {object} props 自定义属性
 * @returns 返回创建的节点
 */
function elt(tagName, className, content, props) {
  const newNode = document.createElement(tagName)
  newNode.className = className
  if (content) newNode.textContent = content
  if (props) {
    for (const key in props) {
      if (props.hasOwnProperty(key)) {
        newNode.setAttribute(key, props[key])
      }
    }
  }
  return newNode
}