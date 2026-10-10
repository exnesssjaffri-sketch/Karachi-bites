// Live simulator ticking down seconds for estimated preparation time
    let secondsLeft = 1440; // 24 minutes
    const timerInterval = setInterval(() => {
      if (secondsLeft > 0) {
        secondsLeft--;
      }
    }, 1000);
