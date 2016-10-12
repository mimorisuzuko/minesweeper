/// <reference path="../typings/index.d.ts" />

const _ = require('lodash');

class World {

	/**
	 * Create minesweeper world.
	 */
	constructor() {
		const $element = document.querySelector('.world-field');

		this.isFirst = true;
		this.cells = [];
		this.$element = $element;
		this.dc = new DifficultyController(this);

		this.update();
	}

	/**
	 * Update minesweeper world by resizing.
	 */
	update() {
		const {height, width, $element} = this;
		this.isFirst = true;
		$element.innerHTML = '';

		this.cells = _.map(Array(height), (a, yIndex) => {
			const $tr = $element.insertRow(-1);
			return _.map(Array(width), (b, xIndex) => {
				const $td = $tr.insertCell(-1);
				return new Cell(this, $td, xIndex, yIndex);
			});
		});
	}

	/**
	 * When first sweeping, Set mines.
	 * @param {Number} xIndex
	 * @param {Number} yIndex
	 */
	setMines(xIndex, yIndex) {
		this.isFirst = false;
		const {width, height, minesLength} = this;
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
	chain(xIndex, yIndex) {
		const {width, height} = this;
		_.forEach(Cell.aroundIndexArray, ([dx, dy]) => {
			const x = xIndex + dx;
			const y = yIndex + dy;
			if (x === -1 || y === -1 || x === width || y === height) { return; }
			const cell = this.cells[y][x];
			if (cell.hasMine || cell.hasSweeped || cell.hasFlag) { return; }
			cell.sweeped();
			if (cell.searchMines() === 0) {
				this.chain(x, y);
			}
		});
	}

	get width() {
		return this.dc.width;
	}

	get height() {
		return this.dc.height;
	}

	get minesLength() {
		return this.dc.minesLength;
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
		$element.addEventListener('contextmenu', this.clickListener.bind(this));
		$element.addEventListener('click', this.clickListener.bind(this));
		$parent.appendChild($element);

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
	 * Open cell.
	 */
	sweeped() {
		this.hasSweeped = true;
		this.$element.classList.add('open');
		if (this.hasMine) {
			this.$element.classList.remove('no-mine');
		}
	}

	/**
	 * Click listener.
	 */
	clickListener() {
		event.preventDefault();
		const $target = event.currentTarget;
		const {button} = event;
		const {xIndex, yIndex} = this;

		if (this.hasSweeped) { return; }
		if (button === 2) {
			this.hasFlag = !$target.classList.toggle('no-flag');
		} else if (button === 0) {
			if (this.world.isFirst) {
				this.world.setMines(xIndex, yIndex);
			}
			if (!this.hasFlag) {
				this.sweeped();
				if (this.hasMine) {
					alert('BOOM!!!!');
					setTimeout(() => {
						this.world.update();
					}, 500);
				} else if (this.searchMines() === 0) {
					this.world.chain(xIndex, yIndex);
				}
			}
		}
	}

	/**
	 * Search around mines.
	 * @returns {Number}
	 */
	searchMines() {
		const {xIndex, yIndex, world} = this;
		const {width, height} = world;
		let sum = 0;
		_.forEach(Cell.aroundIndexArray, ([dx, dy]) => {
			const x = xIndex + dx;
			const y = yIndex + dy;
			if (x === -1 || y === -1 || x === width || y === height) { return; }
			if (this.world.cells[y][x].hasMine) {
				sum += 1;
			}
		});

		if (sum) {
			this.value = sum;
		}

		return sum;
	}

	set value(value) {
		this.$value.innerText = value;
	}

	/**
	 * Create a mine element.
	 * @returns {Element}
	 */
	static createMineElement() {
		const $i = document.createElement('i');
		$i.setAttribute('aria-hidden', true);
		$i.classList.add('fa', 'fa-star');
		return $i;
	}

	/**
	 * Create a flag element.
	 * @returns {Element}
	 */
	static createFlagElement() {
		const $i = document.createElement('i');
		$i.setAttribute('aria-hidden', true);
		$i.classList.add('fa', 'fa-flag');
		return $i;
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
		const $inputs = _.map($element.querySelectorAll('input[type="number"]'), ($a, i) => {
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
	}

	get width() {
		return this._width;
	}

	set width(width) {
		this.$inputs[0].value = this._width = width;
	}

	get height() {
		return this._height;
	}

	set height(height) {
		this.$inputs[1].value = this._height = height;
	}

	get minesLength() {
		return this._minesLength;
	}

	set minesLength(minesLength) {
		this.$inputs[2].value = this._minesLength = minesLength;
	}
}

new World();