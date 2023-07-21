#include <stdio.h>
#include <dirent.h>
#include <string.h>
#include <unistd.h>
#include <time.h>

const char *HIDE_CURSOR = "\e[?25l";
const char *SHOW_CURSOR = "\e[?25h";

float GetBatteryPercentage() {
	FILE *f;
	DIR *d;
	struct dirent *dir;
	char buffer[256];
	size_t read;
	const char *base_dir = "/sys/class/power_supply";
	long unsigned int energy_full;
	long unsigned int energy_now;
	float result = 0;
	d = opendir(base_dir);
	if (d) {
		while((dir = readdir(d)) != NULL) {
			energy_full = 0;
			energy_now = 0;
			if (strlen(dir->d_name) > 3 &&
				dir->d_name[0] == 'B' &&
				dir->d_name[1] == 'A' &&
				dir->d_name[2] == 'T') {
				sprintf(buffer, "%s/%s/energy_full", base_dir, dir->d_name);
				if (f = fopen(buffer, "r")) {
					fscanf(f, "%lu", &energy_full);
					fclose(f);
				}
				sprintf(buffer, "%s/%s/energy_now", base_dir, dir->d_name);
				if (f = fopen(buffer, "r")) {
					fscanf(f, "%lu", &energy_now);
					fclose(f);
				}
				if (!(energy_now == 0 || energy_now == 0)) {
					result = (float)energy_now / (float)energy_full * 100.0f;
					break;
				}
			}
		}
		closedir(d);
	}
	return result;
}

void print_display(float batt_start, float batt_now, time_t ts_start) {
	char buffer[100];
	memset(buffer, 0, 100);
	if (batt_start == batt_now) {
		sprintf(buffer, "Battery: %.2f%%", batt_now);
	}
	else {
		time_t ts_now;
		time(&ts_now);
		float elapsed_seconds = difftime(ts_now, ts_start);
		float batt_percent_diff = batt_start - batt_now;
		float batt_percent_per_second = batt_percent_diff / elapsed_seconds;
		float remaining_seconds = batt_now / batt_percent_per_second;
		float remaining_hours = remaining_seconds / 3600;
		sprintf(buffer, "Battery: %.2f%%, %.2f hours remaining", batt_now, remaining_hours);	
	}
	printf("%s   \r", buffer);
	fflush(stdout);
}

int main(int argc, char **argv) {
	printf(HIDE_CURSOR);
	time_t ts_start;
	float batt_start = GetBatteryPercentage();
	print_display(batt_start, batt_start, ts_start);
	float batt_last = batt_start;
	time(&ts_start);
	while(1) {
		float batt = GetBatteryPercentage();
		if (batt != batt_last) {
			batt_last = batt;
			print_display(batt_start, batt, ts_start);
		}
		usleep(1000000); //microseconds - 1 second
	}
	printf("\n");
	printf(SHOW_CURSOR);
}

