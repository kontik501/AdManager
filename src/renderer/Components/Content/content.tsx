import "./content.css"
import { Fragment } from "react/jsx-runtime"
import DragAndDrop from "./DragNDrop/drag"
import Statistic from "../Statistic/statistic"

export default function Content({roomSelector}:any) {

    return (
        <Fragment>
            <div className="content">
                {roomSelector.name != 'Statistic' && <DragAndDrop selectedRoom = {roomSelector} />}
                {roomSelector.name === 'Statistic' && <Statistic />}
            </div>
        </Fragment>
    )
}