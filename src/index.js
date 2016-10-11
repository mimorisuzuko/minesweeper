/// <reference path="../typings/index.d.ts" />

const _ = require('lodash');

class World {

	/**
	 * Create minesweeper world.
	 */
	constructor() {
		const $element = document.querySelector('.world-field');

		this.isFirst = false;
		this.cels = [];
		this.$element = $element;
		this.dc = new DifficultyController(this);

		this.update();
	}

	/**
	 * Update minesweeper world by resizing.
	 */
	update() {
		this.$element.innerText = '';

		const {height, width, $element} = this;
		const cels = [];
		for (let i = 0; i < height; i += 1) {
			const $line = document.createElement('div');
			$line.classList.add('line');
			$element.appendChild($line);
			for (let j = 0; j < width; j += 1) {
				const index = j + i * width;
				const cel = new Cel(this, $line, index);
				$line.appendChild(cel.$element);
				cels.push(cel);
			}
		}

		this.cels = cels;
	}

	/**
	 * When first sweeping, Set mines.
	 * @param {Number} index
	 */
	setMines(index) {
		this.isFirst = true;
		const {width, height, minesLength} = this;
		const mines = _.pull(_.shuffle(_.map(Array(height * width), (a, i) => i)), index);
		for (let i = 0; i < minesLength; i += 1) {
			const index = mines[i];
			this.cels[index].hasMine = true;
		}
	}

	/**
	 * Calculate index.
	 * @param {Number} index
	 * @param {Number} dx
	 * @param {Number} dy
	 */
	dindex(index, dx, dy) {
		return index + dx + dy * this.width;
	}

	/**
	 * Search around mines.
	 * @param {Number} index
	 */
	chain(index) {
		_.forEach([
			[-1, -1], [0, -1], [1, -1],
			[-1, 0], [1, 0],
			[-1, 1], [0, 1], [1, 1]
		], ([dx, dy]) => {
			const i = this.dindex(index, dx, dy);
			const col = this.cels[i];
			if (!col || col.hasMine || col.hasSweeped || col.hasFlag) { return; }
			col.sweeped();
			if (col.searchMines() === 0) {
				this.chain(i);
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

class Cel {

	/**
	 * Create mainsweeper cel.
	 * @param {World} world
	 * @param {Element} $parent
	 * @param {Number} index
	 */
	constructor(world, $parent, index) {
		const $element = document.createElement('div');
		$element.classList.add('cel', 'no-flag', 'no-mine');
		const $value = document.createElement('div');
		$value.classList.add('value');
		_.forEach([$value, Cel.createFlagElement(), Cel.createMineElement()], (a) => $element.appendChild(a));
		$element.addEventListener('contextmenu', this.clickListener.bind(this));
		$element.addEventListener('click', this.clickListener.bind(this));

		this.$value = $value;
		this.world = world;
		this.$element = $element;
		this.hasMine = false;
		this.index = index;
		this.hasFlag = false;
		this.hasSweeped = false;
	}

	/**
	 * Open cel.
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

		if (this.hasSweeped) { return; }
		if (button === 2) {
			this.hasFlag = !$target.classList.toggle('no-flag');
		} else if (button === 0) {
			if (!this.world.isFirst) {
				this.world.setMines(this.index);
			}
			this.sweeped();
			if (this.hasMine) {
				alert('BOOM!!!!');
				setTimeout(() => {
					this.world.update();
				}, 500);
			} else if (this.searchMines() === 0) {
				this.world.chain(this.index);
			}
		}
	}

	/**
	 * Search around mines.
	 * @returns {Number}
	 */
	searchMines() {
		const {index} = this;
		let sum = 0;
		_.forEach([
			[-1, -1], [0, -1], [1, -1],
			[-1, 0], [1, 0],
			[-1, 1], [0, 1], [1, 1]
		], ([dx, dy]) => {
			const i = this.world.dindex(index, dx, dy);
			const cel = this.world.cels[i];
			if (cel && cel.hasMine) {
				sum += 1;
				console.log(i);
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
		this._width = $inputs[0].value;
		this._height = $inputs[1].value;
		this._minesLength = $inputs[2].value;
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