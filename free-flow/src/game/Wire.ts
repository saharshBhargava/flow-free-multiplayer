import {Cell} from "./Cell"

export class Wire{
    cellPath : Cell[]; //the current cell path
    prevMoveCellPath : Cell[]; //the cell path at the start of this move
    color: number;
    terminal1: Cell; //location of first terminal
    terminal2: Cell; //location of second terminal
    connected : boolean; //starts false, turns to true when terminals connected by path
    isPressed : boolean; //if this wire is currently being pressed (= this is the current color)
    isCrossed : boolean; //if this wire is currently being crossed by another wire

    constructor(color: number) {
        this.color = color;
        this.cellPath = new Array<Cell>;
        this.prevMoveCellPath = new Array<Cell>;
        this.terminal1 = new Cell(-1,-1); //undefined terminal at first
        this.terminal2 = new Cell(-1,-1); //undefined terminal at first
        this.connected = false;
        this.isPressed = false;
        this.isCrossed = false;
    }

    // adding cells to the path when this is the current wire being dragged
    addOnDrag(c: Cell) {
        this.cellPath.push(c);
        this.connected = false;
        this.cutWire();

        //if we dragged past the terminal, remove the stuff after it
        for(let i = 1; i<this.cellPath.length; i++) {
            if(this.isTerminal(this.cellPath[i])) {
                let cutPath = this.cellPath.splice(0, i+1);
                this.cellPath = cutPath;
                return;
            }
        }
    }

    // updates this wire after a move, when mouse is released
    updateAfterMove() {
        //sets the prev cell path to the new cell path
        this.prevMoveCellPath = new Array<Cell>;
        for(let i = 0; i<this.cellPath.length; i++) {
            let curCell = this.cellPath[i];
            this.prevMoveCellPath.push(new Cell(curCell.col, curCell.row));
        }
    }

    // updates this wire when it is being crossed by another wire w
    updateOnCross(w: Wire) {
        let updatePath = new Array<Cell>;
        //check the old path to find where we need to cut
        for(let i = 0; i<this.prevMoveCellPath.length; i++) {
            //find the first cell in the cellpath that intersects with the other wire
            if(w.contains(this.prevMoveCellPath[i])) {    
                break;
            } else {
                updatePath.push(new Cell(this.prevMoveCellPath[i].col, this.prevMoveCellPath[i].row));
            }
        }
        //update the cell path to the new cut version
        this.cellPath = updatePath; 
    }

    // cuts the wire (does it by the order you drew the route) so that there are no repeats
    cutWire() {
        let lastCell : Cell = this.getLastCell();
        let cutPath: Cell[];

        //special case for if this is a terminal
        if(this.isTerminal(lastCell)) {
            if(this.isWireComplete()) {
                this.connected = true;
                console.log("wire complete!!!!");
            } else {
                //erase everything, this went over the one terminal that already had connection
                cutPath = new Array<Cell>;
                cutPath.push(lastCell);
                this.cellPath = cutPath;
            }
        } else {
            for(let i = 0; i<this.cellPath.length-1; i++) {
                //finds first repeat
                if(this.cellPath[i].isEqual(lastCell)) {
                    cutPath = this.cellPath.splice(0, i+1);
                    this.cellPath = cutPath;
                    return;
                }
            }
        }
    }

    //checks if the wire is complete
    isWireComplete() : boolean {
        if(this.cellPath.length == 0) return false; 

        //if endpoints are not terminals, it's not complete
        if(!this.isTerminal(this.cellPath[0])) return false;
        if(!this.isTerminal(this.getLastCell())) return false;

        //if end points are the same terminal, it's not complete
        if(this.cellPath[0].isEqual(this.getLastCell())) return false;

        //checks if everything is actually adjacent
        for(let i = 0; i<this.cellPath.length-1; i++) {
            if(!this.cellPath[i].isAdjacent(this.cellPath[i+1])) return false;
        }
        return true;
    }

    //checks if a cell is a terminal of this wire
    isTerminal(c: Cell) : boolean {
        if(c.isEqual(this.terminal1) || c.isEqual(this.terminal2)) return true;
        return false;
    }
    
    //removes the last cell from the cell path
    removeLastCell() {
        console.log("removing last cell");
        let cutPath: Cell[] = this.cellPath.splice(0, this.cellPath.length-1);
        this.cellPath = cutPath;
    }

    // setting the terminals of the wires
    setTerminal(c: Cell) : void {
        if(this.terminal1.isEqual(new Cell(-1,-1))) { //if first temrinal still undefined, set it here
            this.terminal1 = c;
        } else if(this.terminal2.isEqual(new Cell(-1,-1))) { //otherwise if second terminal undefined, set it here
            this.terminal2 = c;
        } else return; //dont overwrite old terminals
    }

    //gets the last cell on the cell path
    getLastCell() {
        if(this.cellPath.length == 0) return new Cell(-1,-1);
        return this.cellPath[this.cellPath.length-1]; 
    }

    //checks if this wire contains a cell
    contains(c: Cell) : boolean {
        // console.log(c);
        for(let i = 0; i < this.cellPath.length; i++) {
            if(this.cellPath[i].isEqual(c)) return true;
        }
        return false;
    }
    
}