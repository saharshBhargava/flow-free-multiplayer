export class Cell{
    col: number;
    row: number;

    constructor(col: number, row: number) {
        this.col = col;
        this.row = row;
    }

    //checks if this cell is equal to other
    isEqual(c: Cell) : boolean {
        if(c.col == this.col && c.row == this.row) return true;
        return false;
    }

    //checks if this cell is adjacent to other
    isAdjacent(c: Cell) : boolean {
        let dir : string = this.relativeDirection(c);
        if(dir == "") return false;  
        return true;
    }

    //finds the relative direction of c with respect to this cell
    // cell c is (D = down, U = up, R = right, L = left) of this cell
    relativeDirection(c: Cell) : string {
        if (this.col == c.col) { //same column
            if(this.row == c.row - 1) return "D"; //c below this
            else if(this.row == c.row + 1) return "U"; // c above this
        } else if (this.row == c.row) { //same row
            if(this.col == c.col - 1) return "R"; //c right this
            else if(this.col == c.col + 1) return "L"; //c left this
        }
        return ""; //not adjacent
    }
}