import React, { Component } from 'react';
import { 
    View, 
    Animated,
    PanResponder,
    Dimensions,
    LayoutAnimation,
    UIManager
} from 'react-native';

const SCREEN_WIDTH = Dimensions.get('window').width;
const SWIPE_THRESHOLD = 0.25 * SCREEN_WIDTH;
const SWIPE_OUT_DURATION = 250;

class Deck extends Component {
    static defaultProps = {
        onSwipeRight: () => {console.log('static defaultProps onSwipeRight')}, // if user doesn't pass in props onSwipeRight, we will assign this default function to be called
        onSwipeLeft: () => {console.log('static defaultProps onSwipeLeft')} // defaultProps avoids problems where a prop isnt passed in and func doesnt exist
    };

    constructor(props) {
        super(props);

        const position = new Animated.ValueXY();
        const panResponder = PanResponder.create({
            onStartShouldSetPanResponder: () => true,
            onPanResponderMove: (event, gesture) => {
                /*
                debugger
                //console.log(event);
                console.log(gesture);
                //console.log();
                */
                position.setValue({x: gesture.dx, y: gesture.dy});
            },
            onPanResponderRelease: (event, gesture) => {
                if(gesture.dx > SWIPE_THRESHOLD) {
                    this.forceSwipe('right');
                } else if(gesture.dx < -SWIPE_THRESHOLD) {
                    this.forceSwipe('left');
                } else {
                    this.resetPosition();
                }
            }
        });

        this.state = { panResponder, position, index: 0 };
    }

    componentWillReceiveProps(nextProps) {
        if (nextProps.data !== this.props.data) {
            this.setState({ index: 0 });
        }
    }

    componentWillUpdate() {
        UIManager.setLayoutAnimationEnabledExperimental && UIManager.setLayoutAnimationEnabledExperimental(true);
        LayoutAnimation.spring(); // the next time it rerenders this component, it needs to animate any changes made to this component itself.
        // for example, after swiping, the cards pop up, this will animate that instead of just moving the y, which will be smoother
    }

    forceSwipe(direction) {
        const x = direction === 'right' ? SCREEN_WIDTH : -SCREEN_WIDTH;
        console.log('forceSwipe!', x);
        Animated.timing(this.state.position, {
            toValue: { x, y: 0 },
            duration: SWIPE_OUT_DURATION
        }).start(() => this.onSwipeComplete(direction));
    }

    onSwipeComplete(direction) {
        const { onSwipeLeft, onSwipeRight, data } = this.props;
        const item = data[this.state.index];

        direction === 'right' ? onSwipeRight(item) : onSwipeRight(item);
        this.state.position.setValue({ x: 0, y: 0 });
        this.setState({ index: this.state.index + 1 });
    }

    resetPosition() {
        Animated.spring(this.state.position, { 
            toValue: { x: 0, y: 0 }
        }).start();
    }

    getCardStyle() {
        const { position } = this.state;
        const rotate = position.x.interpolate({
            inputRange: [-SCREEN_WIDTH * 1.5, 0, SCREEN_WIDTH * 1.5],
            outputRange: ['-120deg', '0deg', '120deg']
        });

        return {
            ...position.getLayout(),
            transform: [{ rotate }]
        }
    }

    renderCards() {
        if(this.state.index >= this.props.data.length) {
            return this.props.renderNoMoreCards();
        }

        return this.props.data.map((item, i) => {
            if(i < this.state.index) { return null };
            
            if(i === this.state.index) {
                return (
                    <Animated.View
                        key={item.id}
                        //style={this.state.position.getLayout()}  
                        style={[this.getCardStyle(), styles.cardStyle]}  
                        {...this.state.panResponder.panHandlers}
                    >
                        {this.props.renderCard(item)}
                    </Animated.View>
                );
            }
           return (
                <Animated.View 
                    key={item.id} 
                    style={[styles.cardStyle, { top: 10 * (i - this.state.index) }]}
                >
                    {this.props.renderCard(item)}
                </Animated.View>
           );
        }).reverse();
    }
    // This is what it takes to attach panResponder to a React Object
    render() {
        return (
            <View>
                {this.renderCards()}
            </View>
        );
    }
}

const styles = {
    cardStyle: {
        position: 'absolute',
        width: SCREEN_WIDTH
    }
}

export default Deck;