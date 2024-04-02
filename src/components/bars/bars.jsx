import { useState, createContext  } from 'react'
import "./bars.scss"

const selectedTab = createContext(null)

function HeadBar({children})
{
    return <div>

    </div>
}

function ToolBar({children})
{
    return <div>

    </div>
}

function SideBar({children})
{
    return <div>

    </div>
}

// function 

function Bars({HeadBar, ToolBar, SideBar, Tab, TabsBar}) {
  

  return (
    <>
      {HeadBar}
      <div>
        {SideBar}
        <div>
            {ToolBar}
            {Tab}
            {TabsBar}
        </div>
      </div>
    </>
  )
}

// export default App
