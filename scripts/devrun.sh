#!/bin/zsh
workdir=$(pwd)

if [ "$1" = "build" ]; then
    echo "Using production build for frontend..."
    cd client
    npm run build
    exit 0
fi

cd $workdir
# Define your commands
CMD1="cd backend; npm run dev"
CMD2="cd client; npm run preview"
CMD3="cd core; python run.py"

# Start a new tmux session
tmux new-session -d -s nsil_session

tmux rename-window -t nsil_session:0 'Backend'
tmux send-keys -t nsil_session:0 "$CMD1" C-m

tmux new-window -t nsil_session -n 'Frontend'
tmux send-keys -t nsil_session:1 "$CMD2" C-m

tmux new-window -t nsil_session -n 'Core'
tmux send-keys -t nsil_session:2 "$CMD3" C-m
