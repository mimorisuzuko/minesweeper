/// <reference path="../typings/index.d.ts" />

const _ = require('lodash');

class World {

	/**
	 * Create minesweeper world.
	 */
	constructor() {
		const $element = document.querySelector('.world-field');

		this.sweepingCount = 0;
		this.xIndex = 0;
		this.yIndex = 0;
		this.isFirst = true;
		this.cells = [];
		this.$element = $element;
		this.size = 0;
		this.dc = new DifficultyController(this);

		document.body.addEventListener('keydown', this.keydowner.bind(this));

		this.update();
	}

	/**
	 * Sweep a mine.
	 * @param {Cell} cell
	 */
	sweep(cell) {
		if (!cell || cell.hasFlag || cell.hasSweeped) { return; }

		// set mines to the world
		if (this.isFirst) {
			this.setMines();
		}

		if (cell.sweeped()) {
			const length = cell.aroundMinesLength();
			if (length) {
				cell.value = length;
			} else {
				this.chain(cell.xIndex, cell.yIndex);
			}

			this.sweepingCount += 1;
			const rate = (this.sweepingCount + this.minesLength) / this.size;
			this.rate = rate;

			if (rate === 1) {
				alert('CLEAR!!!!');
				setTimeout(() => {
					this.update();
				}, 300);
			}

		} else {
			// Restart the world
			alert('BOOM!!!!');
			setTimeout(() => {
				this.update();
			}, 300);
		}
	}

	/**
	 * Keydown listener
	 */
	keydowner() {
		const k = event.keyCode;
		if (k === 38) {
			event.preventDefault();
			this.move(0, -1);
		} else if (k === 39) {
			event.preventDefault();
			this.move(1, 0);
		} else if (k === 40) {
			event.preventDefault();
			this.move(0, 1);
		} else if (k === 37) {
			event.preventDefault();
			this.move(-1, 0);
		} else if (k === 90) {
			event.preventDefault();
			this.sweep(this.cell());
		} else if (k === 88) {
			event.preventDefault();
			this.cell().toggleFlag();
		} else if (k === 67) {
			event.preventDefault();
			const {width, height} = this;
			const cell = this.cell();
			const {xIndex, yIndex, value, hasFlag, hasSweeped} = cell;
			if (!hasSweeped || hasFlag) { return; }
			if (cell.aroundFlagsLength() === value) {
				_.forEach(Cell.aroundIndexArray, ([dx, dy]) => {
					const x = xIndex + dx;
					const y = yIndex + dy;
					this.sweep(this.cell(x, y));
				});
			}
		}
	}

	/**
	 * Move current cell.
	 * @param {Number} dx
	 * @param {Number} dy
	 */
	move(dx, dy) {
		const {width, height} = this;

		this.cells[this.yIndex][this.xIndex].$element.classList.remove('current');

		this.xIndex += dx;
		if (this.xIndex === width) {
			this.xIndex = 0;
		} else if (this.xIndex === -1) {
			this.xIndex = width - 1;
		}
		this.yIndex += dy;
		if (this.yIndex === height) {
			this.yIndex = 0;
		} else if (this.yIndex === -1) {
			this.yIndex = height - 1;
		}

		this.cells[this.yIndex][this.xIndex].$element.classList.add('current');
	}

	/**
	 * Update minesweeper world by resizing.
	 */
	update() {
		const {height, width, $element, minesLength} = this;
		const size = width * height;

		this.isFirst = true;
		this.xIndex = 0;
		this.yIndex = 0;
		this.size = size;
		this.rate = 0;
		this.sweepingCount = 0;
		$element.innerHTML = '';

		this.cells = _.map(Array(height), (a, yIndex) => {
			const $tr = $element.insertRow(-1);
			return _.map(Array(width), (b, xIndex) => {
				const $td = $tr.insertCell(-1);
				return new Cell(this, $td, xIndex, yIndex);
			});
		});

		this.cells[this.yIndex][this.xIndex].$element.classList.add('current');
	}

	/**
	 * When first sweeping, Set mines.
	 */
	setMines() {
		this.isFirst = false;
		const {width, height, minesLength, xIndex, yIndex} = this;
		const mines = _.pull(_.shuffle(_.map(Array(height * width), (a, i) => i)), xIndex + yIndex * width);
		for (let i = 0; i < minesLength; i += 1) {
			const index = mines[i];
			const x = index % width;
			const y = Math.floor(index / width);
			this.cells[y][x].hasMine = true;
		}
	}

	/**
	 * Search around mines.
	 * @param {Number} xIndex
	 * @param {Number} yIndex
	 */
	chain(xIndex = this.xIndex, yIndex = this.yIndex) {
		const {width, height} = this;
		_.forEach(Cell.aroundIndexArray, ([dx, dy]) => {
			const x = xIndex + dx;
			const y = yIndex + dy;
			this.sweep(this.cell(x, y));
		});
	}

	/**
	 * Whether xIndex and yIndex is in thw World, or not.
	 * @param {Number} xIndex
	 * @param {Number} yIndex
	 * @returns {Boolean}
	 */
	contains(xIndex, yIndex) {
		const {width, height} = this;
		return -1 < xIndex && xIndex < width && -1 < yIndex && yIndex < height;
	}

	/**
	 * Get the cell that is named by index.
	 * @param {Number} xIndex
	 * @param {Number} yIndex
	 * @returns {Cell}
	 */
	cell(xIndex = this.xIndex, yIndex = this.yIndex) {
		return this.contains(xIndex, yIndex) ? this.cells[yIndex][xIndex] : null;
	}

	get width() {
		return this.dc.width;
	}

	set width(width) {
		this.dc.width = width;
	}

	get height() {
		return this.dc.height;
	}

	set height(height) {
		this.dc.height = height;
	}

	get minesLength() {
		return this.dc.minesLength;
	}

	set minesLength(minesLength) {
		this.dc.minesLength = minesLength;
	}

	set rate(rate) {
		this.dc.rate = rate.toFixed(2);
	}
}

class Cell {

	/**
	 * Create mainsweeper cell.
	 * @param {World} world
	 * @param {Element} $parent
	 * @param {Number} xIndex
	 * @param {Number} yIndex
	 */
	constructor(world, $parent, xIndex, yIndex) {
		const $element = document.createElement('div');
		$element.classList.add('cel', 'no-flag', 'no-mine');
		const $value = document.createElement('div');
		$value.classList.add('value');
		_.forEach([$value, Cell.createFlagElement(), Cell.createMineElement()], (a) => $element.appendChild(a));
		$parent.appendChild($element);

		this._value = 0;
		this.$value = $value;
		this.world = world;
		this.$element = $element;
		this.hasMine = false;
		this.xIndex = xIndex;
		this.yIndex = yIndex;
		this.hasFlag = false;
		this.hasSweeped = false;
	}

	/**
	 * Toggle a flag.
	 */
	toggleFlag() {
		if (this.hasSweeped) { return; }
		this.hasFlag = !this.$element.classList.toggle('no-flag');
	}

	/**
	 * Open a cell.
	 * @returns {Boolean}
	 */
	sweeped() {
		this.hasSweeped = true;
		this.$element.classList.add('open');
		if (this.hasMine) {
			this.$element.classList.remove('no-mine');
		}
		return !this.hasMine;
	}

	/**
	 * Return around flags length.
	 * @returns {Number}
	 */
	aroundMinesLength() {
		const {xIndex, yIndex, world} = this;
		const {width, height, cells} = world;
		return _.reduce(Cell.aroundIndexArray, (a, [dx, dy]) => {
			const x = xIndex + dx;
			const y = yIndex + dy;
			if (!world.contains(x, y)) {
				return a;
			}
			const cell = cells[y][x];
			return cell.hasMine ? a + 1 : a;
		}, 0);
	}

	/**
	 * Return around flags length.
	 * @returns {Number}
	 */
	aroundFlagsLength() {
		const {xIndex, yIndex, world} = this;
		const {width, height, cells} = world;
		return _.reduce(Cell.aroundIndexArray, (sum, [dx, dy]) => {
			const x = xIndex + dx;
			const y = yIndex + dy;
			if (!world.contains(x, y)) {
				return sum;
			}
			const cell = cells[y][x];
			return cell.hasFlag ? sum + 1 : sum;
		}, 0);
	}

	get value() {
		return this._value;
	}

	set value(value) {
		this._value = value;
		this.$value.innerText = value;
	}

	/**
	 * Create a mine element.
	 * @returns {Element}
	 */
	static createMineElement() {
		const $img = document.createElement('img');
		$img.classList.add('mine');
		$img.src = './images/mine.png';
		return $img;
	}

	/**
	 * Create a flag element.
	 * @returns {Element}
	 */
	static createFlagElement() {
		const $img = document.createElement('img');
		$img.classList.add('flag');
		$img.src = './images/flag.png';
		return $img;
	}

	static get aroundIndexArray() {
		return [
			[-1, -1], [0, -1], [1, -1],
			[-1, 0], [1, 0],
			[-1, 1], [0, 1], [1, 1]
		];
	}
}

class DifficultyController {

	/**
	 * Controll minesweeper difficulty.
	 * @param {World} world
	 */
	constructor(world) {
		const $element = document.querySelector('.difficulty-controller');
		const keys = ['width', 'height', 'minesLength'];
		const $inputs = _.map($element.querySelectorAll('input'), ($a, i) => {
			$a.addEventListener('change', () => {
				this[keys[i]] = event.currentTarget.value;
				this.world.update();
			});
			return $a;
		});

		this.world = world;
		this.$inputs = $inputs;
		this._width = parseInt($inputs[0].value, 10);
		this._height = parseInt($inputs[1].value, 10);
		this._minesLength = parseInt($inputs[2].value, 10);
		this._rate = $inputs[3];
	}

	get width() {
		return this._width;
	}

	set width(width) {
		this.$inputs[0].value = this._width = _.parseInt(width, 10);
	}

	get height() {
		return this._height;
	}

	set height(height) {
		this.$inputs[1].value = this._height = _.parseInt(height, 10);
	}

	get minesLength() {
		return this._minesLength;
	}

	set minesLength(minesLength) {
		this.$inputs[2].value = this._minesLength = _.parseInt(minesLength, 10);
	}

	get rate() {
		return this._rate;
	}

	set rate(rate) {
		this.$inputs[3].value = this._rate = rate;
	}
}

new World();