const IconTable = {
    "clear":     'url("/imgs/clear.png")',
    "squares":   'url("/imgs/select.png")',
    "rotate":    'url("/imgs/rotate.png")',
    "scale":     'url("/imgs/size.png")',
    "transform": 'url("/imgs/transform.png")',
}

function createElement(type, id, className)
{
    const el = document.createElement(type)

    if (id)
        el.id = id

    if (className)
        el.className = className

    return el
}

function createKey() {
    return "10000000-1000-4000-8000-100000000000".replace(/[018]/g, c =>
        (c ^ crypto.getRandomValues(new Uint8Array(1))[0] & 15 >> c / 4).toString(16)
    );
}

class Events
{
    constructor()
    {
        this.connections = {}
        this.parent = null
    }

    setParent(parent)
    {
        this.parent = parent
    }

    connect(event, funct) {
        if (!this.connections[event])
            this.connections[event] = {}

        const key = createKey()
        this.connections[event][key] = funct

        return key
    }

    disconnect(event, key)
    {
        if (this.connections[event] && this.connections[event][key])
            delete this.connections[event][key]
    }

    fire(event, ...args)
    {
        console.log(event, "was fired")
        const event_cons = this.connections[event]
        if (event_cons)
        {
            Object.keys(event_cons).map((key) => {
                event_cons[key](...args)
            })
        }

        if (this.parent)
        {
            this.parent.fire(event, ...args)
        }
    }
}

class Layer
{
    constructor()
    {
        this.parent = null
    }
}

function CreateHorizontalBar()
{
    const main_div = createElement("div", null, "smallborder-horizontal")
    const sub_div = createElement("div")
    main_div.appendChild(sub_div)
    return main_div
}

class IconButton
{
    constructor(name, icon)
    {
        this.name = name || "unnamed-button"
        this.icon = icon
        this.action = () => {}

        this.selected = false
        this.active = true

        this.elements = []
    }

    setAction(action)
    {
        this.action = action
    }

    updateState()
    {
        this.elements.map(({element}) => {
            element.className = `iconbutton${this.selected?" selected":""}${this.active?"":" unactive"}`
        })
    }

    toggleSelected(toggle)
    {
        // Checking for no change
        if (this.selected == toggle) {return;}

        this.selected = toggle
        this.updateState()
    }

    toggleActive(toggle)
    {
        // Checking for no change
        if (this.active == toggle) {return;}

        this.active = toggle
        this.updateState()
    }

    render()
    {
        const element = createElement("div", null, "iconbutton")

        const icon_element = createElement("div", null, "icon")
        icon_element.style.backgroundImage = IconTable[this.icon]?IconTable[this.icon]:this.icon
        element.appendChild(icon_element)

        element.onclick = (e) => {
            if (this.action)
                this.action(e)
        }

        this.elements.push({"element": element})

        return element
    }
}

class IconButtonGroup
{
    constructor(name)
    {
        this.name = name
        this.buttons = []

        this.elements = []
    }

    addButton(button)
    {
        this.buttons.push(button)
    }

    render()
    {
        const element = document.createElement("div")
        element.className = "iconbuttongroup"

        const button_element_list = []
        this.buttons.map(button => {
            const button_element = button.render()
            button_element_list.push(button_element)
            element.appendChild(button_element)
        })

        this.elements.push({
            "element": element,
            "button_list": button_element_list
        })

        return element
    }
}

class IconButtonSelectGroup extends IconButtonGroup
{
    constructor(name, events)
    {
        super(name)
        this.selected = null
        this.buttons = []
        this.events = events
    }

    updateSelected()
    {
        this.buttons.map(button => {
            button.toggleSelected(button.name == this.selected)
        })
        this.events.fire(this.name+"_updated", this.selected)
    }

    setSelected(value)
    {
        this.selected = value
        this.updateSelected()
    }

    addButton(name, icon)
    {
        const button = new IconButton(name, icon)
        button.setAction((e) => {
            this.selected = this.selected==name?null:name
            this.updateSelected()
        })

        this.buttons.push(button)
    }

    render()
    {
        const element = super.render()

        return element
    }
}

class Bar 
{
    constructor(name)
    {
        this.elements = []
        this.items = []
        this.name = name
        
    }

    addItem(item)
    {
        this.items.push(item)
    }

    render()
    {
        const element = createElement("div", null, "bar")

        const item_element_list = []
        this.items.map(item => {
            const element_container = createElement("div", null, "bar-item-container")
            const item_element = item.render()
            item_element_list.push(item_element)
            element.appendChild(element_container)
            element_container.appendChild(item_element)
        })

        this.elements.push({
            "element": element,
            "item_list": item_element_list
        })

        return element
    }
}

class Bars
{
    constructor(root)
    {
        this.root = root
        this.headbar = new Bar("headbar");
        this.toolbar = new Bar("toolbar")

        this.main_content = createElement("div", "main-content-container")

        const main_content_resizer = new ResizeObserver(entities => {
            this.events.fire("main-content-resize")
        })

        main_content_resizer.observe(this.main_content)

        this.events = new Events();
    }

    render()
    {
        const headbar_element = this.headbar.render()
        this.root.appendChild(headbar_element);

        this.root.appendChild(CreateHorizontalBar())

        const toolbar_element = this.toolbar.render()
        this.root.appendChild(toolbar_element);

        this.root.appendChild(CreateHorizontalBar())

        this.root.appendChild(this.main_content)
    }

    setEvents(events)
    {
        this.events = events
    }
}

export { 
    Bars,
    
    Events,
    createKey, 

    IconButton, 
    IconButtonGroup, 
    IconButtonSelectGroup
}