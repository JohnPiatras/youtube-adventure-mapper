function ProgressBar(){
    this.spinner = '▌▀▐▄'.split('');
    this.spinner_index = 0;
    this.print = function(currentValue, totalValue){
        let percent = 100.0 * currentValue / totalValue;
        let progress_bar = "|";
    
        bar_fill = Math.floor(percent / 2);
    
        progress_bar = this.spinner[this.spinner_index] + ' |' + '='.repeat(bar_fill) + ' '.repeat(50 - bar_fill) + '|' + ` ${Math.floor(percent)}%`;
        this.spinner_index++;
        if(this.spinner_index > this.spinner.length-1)this.spinner_index = 0;
        process.stdout.write(`\r${progress_bar}`);    
    }
}

module.exports = ProgressBar;
