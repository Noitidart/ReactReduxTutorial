// Globals
var PropTypes = React.PropTypes;
var thunkMiddleware = ReduxThunk.default;

// ACTIONS
const ADD_TODO = 'ADD_TODO';
const TOGGLE_TODO = 'TOGGLE_TODO';
const SET_VISIBILITY_FILTER = 'SET_VISIBILITY_FILTER';
// VisibilityFilters
const SHOW_ALL = 'SHOW_ALL';
const SHOW_COMPLETED = 'SHOW_COMPLETED';
const SHOW_ACTIVE = 'SHOW_ACTIVE';

const ADD_NOTIFICATION = 'ADD_NOTIFICATION';
const REMOVE_NOTIFICATION = 'REMOVE_NOTIFICATION';

// ACTION CREATORS
var nextTodoId = 0;
function addTodo(text) {
	return {
		type: ADD_TODO,
		id: nextTodoId++,
		text
	}
}
function toggleTodo(id) {
	return {
		type: TOGGLE_TODO,
		id
	}
}

function setVisibilityFilter(filter) {
	return {
		type: SET_VISIBILITY_FILTER,
		filter
	}
}

function addNotification(text, id) {
	return {
		type: ADD_NOTIFICATION,
		text,
		id
	}
}

function removeNotification(id) {
	return {
		type: REMOVE_NOTIFICATION,
		id
	}
}

// ACTION CREATORS - ASYNC
var nextNotificationId = 0;
function addSelfHidingNotification(text) {
	return function(dispatch) {
		var id = nextNotificationId++;
		dispatch(addNotification(text, id));
		
		setTimeout(function() {
			dispatch(removeNotification(id))
		}, 5000);
	}
}

// REDUCERS
//// const initialState = {
//// 	visibilityFilter: SHOW_ALL,
//// 	todos: [],
//// 	notifications: []
//// };

function todos(state = [], action) {
	switch (action.type) {
		case ADD_TODO:
		
			return [
				...state,
				{
					id: action.id,
					text: action.text,
					completed: false
				}
			]
			
		case TOGGLE_TODO:
		
			return state.map((todo) => {
				if (todo.id === action.id) {
					return Object.assign({}, todo, {
						completed: !todo.completed
					})
				}
				return todo
			})
	
		default:
		
			return state
	}
}

function visibilityFilter(state = SHOW_ALL, action) {
	switch (action.type) {
		case SET_VISIBILITY_FILTER:
		
			return action.filter;
			
		default:
		
			return state
	}
}

function notifications(state = [], action) {
	switch (action.type) {
		case ADD_NOTIFICATION:
		
			return [
				...state,
				{
					text: action.text,
					id: action.id
				}
			];
		
		case REMOVE_NOTIFICATION:
		
			return state.filter(notification => {
				return notification.id !== action.id
			});
		
		default:
		
			return state
	}
}

const todoApp = Redux.combineReducers({
	visibilityFilter,
	todos,
	notifications
});

// STORE
var store = Redux.createStore(todoApp, Redux.applyMiddleware(
	thunkMiddleware
));

var unsubscribe = store.subscribe(() =>
	console.log(store.getState())
)

// REACT COMPONENTS - PRESENTATIONAL
var Todo = function({onClick, completed, text}) {
	return React.createElement('li', { onClick, style:{textDecoration:(completed ? 'line-through' : 'none')} },
		text	
	);
}

Todo.propTypes = {
	onClick: PropTypes.func.isRequired,
	completed: PropTypes.bool.isRequired,
	text: PropTypes.string.isRequired
}

var TodoList = function({todos, onTodoClick}) {
	return React.createElement('ul', {},
		todos.map(todo => { return React.createElement(Todo, { key:todo.id, completed:todo.completed, text:todo.text, onClick:onTodoClick.bind(null, todo.id) }); })
	);
}

TodoList.propTypes = {
	todos: PropTypes.arrayOf(PropTypes.shape(Object.assign({id:PropTypes.number.isRequired}, Todo.propTypes, {onClick:undefined})).isRequired).isRequired,
	onTodoClick: PropTypes.func.isRequired
}

var Link = function({active, children, onClick}) {
	if (active) {
		return React.createElement('span', undefined, children);
	}
	
	preventedClick = function(e) {
		e.preventDefault();
		onClick();
	};
	
	return React.createElement('a', { href:'#', onClick:preventedClick },
		children
	);
}

Link.propTypes = {
	active: PropTypes.bool.isRequired,
	children: PropTypes.node.isRequired,
	onClick: PropTypes.func.isRequired
}

var Footer = function() {
	return React.createElement('p', {},
		'Show:',
		' ',
		React.createElement(FilterLink, { filter:SHOW_ALL },
			'All'
		),
		', ',
		React.createElement(FilterLink, { filter:SHOW_ACTIVE },
			'Active'
		),
		', ',
		React.createElement(FilterLink, { filter:SHOW_COMPLETED },
			'Completed'
		)
	);
}

var App = function() {
	return React.createElement('div', null,
		React.createElement(NotificationListDux),
		React.createElement(AddTodoLink),
		React.createElement(VisibleTodoList),
		React.createElement(Footer)
	);
}

// REACT COMPONENTS - CONTAINER
const getVisibleTodos = function(todos, filter) {
	switch (filter) {
		case SHOW_ALL:
			return todos
		case SHOW_COMPLETED:
			return todos.filter(t => t.completed)
		case SHOW_ACTIVE:
			return todos.filter(t => !t.completed)
	}
}

const VisibleTodoList = ReactRedux.connect(
	function mapStateToProps(state) {
		return {
			todos: getVisibleTodos(state.todos, state.visibilityFilter)
		}
	},
	function mapDispatchToProps(dispatch) {
		return {
			onTodoClick: function(id) {
				dispatch(toggleTodo(id))
			}
		}
	}
)(TodoList);

const FilterLink = ReactRedux.connect(
	function mapStateToProps(state, ownProps) {
		return {
			active: ownProps.filter === state.visibilityFilter
		}
	},
	function mapDispatchToProps(dispatch, ownProps) {
		return {
			onClick: function() {
				dispatch(setVisibilityFilter(ownProps.filter))
			}
		}
	}
)(Link);

var AddTodo = function({dispatch}) {
	var input;

	var ref = function(node) {
		input = node;
	}
	
	var onClick = function() {
		var text = input.value;
		input.value = '';
		dispatch(addTodo(text));
		dispatch(addSelfHidingNotification('Added item "' + text + '"'));
	}
	
	return React.createElement('div', null,
		React.createElement('input', { ref, type:'text' }),
		React.createElement('button', { onClick },
			'Add Todo'
		)
	);
}
var AddTodoLink = ReactRedux.connect()(AddTodo);

function Notification({text}) {
	return React.createElement('div', { style:{padding:20, margin:20, backgroundColor:'rgba(0,0,0,0.1)'} },
		text
	);
}


function NotificationList({notifications}) {
	return React.createElement('div', { style:{position:'absolute',width:'100%'} },
		notifications.map(function(notification) {
			console.log('notification:', notification);
			return React.createElement(Notification, { text:notification.text });
		})
	)
}

var NotificationListDux = ReactRedux.connect(
	function mapStateToProps(state, ownProps) {
		return {
			notifications: state.notifications
		}
	}
)(NotificationList);

window.addEventListener('DOMContentLoaded', function() {
	ReactDOM.render(
		React.createElement(ReactRedux.Provider, { store },
			React.createElement(App)
		),
		document.getElementById('root')
	)
}, false);