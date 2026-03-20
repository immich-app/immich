package app.alextran.immich;

import androidx.test.rule.ActivityTestRule;
import org.junit.Rule;
import org.junit.Test;

public class MainActivityTest {
    @Rule
    public ActivityTestRule<MainActivity> activityRule =
            new ActivityTestRule<>(MainActivity.class);

    @Test
    public void appLaunches() {
        // Verify the app launches without crashing
    }
}
