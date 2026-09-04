/*  ___  _               _            ___  _             
   |_ _|| |_  ___  ___ _| |_ ___  _ _|_ _|<_>._ _ _  ___ 
    | | | . |/ ._><_> | | | / ._>| '_>| | | || ' ' |/ ._>
    |_| |_|_|\___.<___| |_| \___.|_|  |_| |_||_|_|_|\___.
	(c) 2026 J.T.Sage - MIT License

	Utilities
*/

// MARK: safe element ops
export const listenToId = ( id : string, type : string, func : EventListenerOrEventListenerObject ) => {
	const element = getId( id )
	if ( element !== null ) {
		element.addEventListener( type, func )
	}
}

export const setInnerHTML = ( id : string, value : string ) => {
	const element = getId( id )
	if ( element !== null ) {
		element.innerHTML = value
	}
}

export const getId = ( id : string ) => {
	return document.getElementById( id )
}

export const getFormId = ( id : string ) => {
	const element = getId( id )
	if ( element instanceof HTMLInputElement && element !== null ) {
		return element
	}
	return null
}

export const getSelectValue = ( id : string ) : string | null => {
	const element = getId( id )
	if ( element instanceof HTMLSelectElement && element !== null ) {
		return element.value
	}
	return null
}

export const getFormValue = ( id : string ) : string | null => {
	const element = getId( id )
	if ( element instanceof HTMLInputElement && element !== null ) {
		return element.value
	}
	return null
}

export const getFormCheck = ( id : string ) : boolean => {
	const element = getId( id )
	if ( element instanceof HTMLInputElement && element !== null ) {
		return element.checked
	}
	return false
}

export const safeClassAdd = ( element : Element | null | undefined, className : string ) => {
	if ( typeof element !== 'undefined' && element !== null ) {
		element.classList.add( className )
	}
}

export const safeClassRem = ( element : Element | null | undefined, className : string ) => {
	if ( typeof element !== 'undefined' && element !== null ) {
		element.classList.remove( className )
	}
}

export const classAdd = ( id : string, classes : string | string[] ) => {
	const element = getId( id )
	if ( element !== null ) {
		if ( typeof classes === 'string' ) {
			element.classList.add( classes )
		} else {
			element.classList.add( ...classes )
		}
	}
}

export const classRemove = ( id : string, classes : string | string[] ) => {
	const element = getId( id )
	if ( element !== null ) {
		if ( typeof classes === 'string' ) {
			element.classList.remove( classes )
		} else {
			element.classList.remove( ...classes )
		}
	}
}

export const setFormValue = ( id : string, value : string ) => {
	const element = getId( id )
	if ( element instanceof HTMLInputElement && element !== null ) {
		element.value = value
	}
}

export const setSelectValue = ( id : string, value : string ) => {
	const element = getId( id )
	if ( element instanceof HTMLSelectElement && element !== null ) {
		element.value = value
	}
}

export const setFormCheck = ( id : string, value : boolean ) => {
	const element = getId( id )
	if ( element instanceof HTMLInputElement && element !== null ) {
		element.checked = value
	}
}

export const setFormEnabled = ( id : string, enabled : boolean ) => {
	const element = getId( id )
	if ( element instanceof HTMLInputElement && element !== null ) {
		element.disabled = !enabled
	}
}


// MARK : generate HTML

const TimerType : Record<number, string> = Object.freeze( {
	0 : '!!Invalid!!',
	1 : 'Count Up',
	2 : 'Count Down to DateTime',
	3 : 'Count Down to # of Minutes',
} )


// MARK: other HTML
export const HTMLButtons = ( type : string, index : number, create = false, no_delete_first = true ) => {
	return [
		`<button data-action="save-${type}" title="Save ALL Changes" class="btn btn-sm btn-success action-btn ${!create ? 'd-none':''}" type="button"><i class="bi bi-floppy2"></i></button>`,
		`<button data-action="reload" title="Discard ALL Changes" class="btn btn-sm btn-primary action-btn ${!create ? 'd-none':''}" type="button"><i class="bi bi-arrow-clockwise"></i></button>`,
		`<button data-action="remove-${type}" title="Remove Item" data-index="${index}" class="btn btn-sm btn-danger action-btn ${create || ( index === 0 && no_delete_first ) ? 'd-none':''}" type="button"><i class="bi bi-trash3-fill"></i></button>`,
	]
}

export const HTMLFormText = ( inputName : string, value : string | null, title : string, desc : string | null = null ) => {
	return [
		'<div class="input-group mb-1">',
		`<span title="${desc !== null ? desc : title}" class="input-group-text w-25">${title}</span>`,
		`<input type="text" class="form-control" name="${inputName}" value="${value}">`,
		'</div>',
	]
}

export const HTMLTimerType = ( type : number ) => {
	return [
		'<div class="input-group mb-1">',
		'<span title="Type of timer" class="input-group-text w-25">Type</span>',
		'<select name="type" class="form-select">',
		...[1, 2, 3].map( ( i ) => {
			return `<option value="${i}" ${i === type ? 'selected' : ''}>${TimerType[i]}</option>`
		} ),
		'</select></div>'
	]
}

export const HTMLToggleButton = ( buttonName : string, title : string, value : boolean, desc : string | null = null, {trueColor = 'success', trueText = 'ON', falseColor = 'danger', falseText = 'OFF'} = {} ) => {
	const id_1 = crypto.randomUUID()
	const id_2 = crypto.randomUUID()
	return [
		`<div class="input-group mb-1 toggle-${buttonName}">`,
		`<span title="${desc !== null ? desc : title}" class="input-group-text w-25">${title}</span><div class="btn-group w-75">`,
		`<input type="radio" class="btn-check" name="${buttonName}" value="true" id="${id_1}" autocomplete="off" ${value ? 'checked' : ''}>`,
		`<label class="btn btn-outline-${trueColor} rounded-0" for="${id_1}">${trueText}</label>`,

		`<input type="radio" class="btn-check" name="${buttonName}" value="false" id="${id_2}" autocomplete="off" ${!value ? 'checked' : ''}>`,
		`<label class="btn btn-outline-${falseColor}" for="${id_2}">${falseText}</label>`,
		'</div></div>',
	]
}


export const HTMLOption = ( value : string, title : string, selected : boolean ) => {
	return `<option value="${value}" ${selected ? 'selected' : ''}>${title}</option>`
}