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
    }
}

function CreateHorizontalBar()
{
    const main_div = createElement("div", null, "smallborder-horizontal")
    const sub_div = createElement("div")
    main_div.appendChild(sub_div)
    return main_div
}

class Bars
{
    constructor(root)
    {
        this.root = root
        this.headbar = createElement("div", "headbar");
        this.toolbar = createElement("div", "toolbar");

        this.main_content = createElement("div", "main-content-container")

        this.events = new Events();

        const main_content_resizer = new ResizeObserver(entities => {
            this.events.fire("main-content-resize")
        })

        main_content_resizer.observe(this.main_content)

        this.toolbar_tools = {}
    }

    render()
    {
        this.root.appendChild(this.headbar);

        this.root.appendChild(CreateHorizontalBar())

        this.root.appendChild(this.toolbar);

        this.root.appendChild(CreateHorizontalBar())

        this.root.appendChild(this.main_content)
    }

    addTool(name, icon, funct)
    {
        const tool = createElement("div", null, "toolbar-tool")
        tool.backgroundImage = icon
        tool.onclick = funct
        this.toolbar_tools[name] = [tool, name, icon, funct]
        this.toolbar.appendChild(tool)
    }
}

export { Bars }