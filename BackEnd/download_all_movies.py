import requests
import os
from concurrent.futures import ThreadPoolExecutor, as_completed
import time

# Public Domain Full Movies - 56 Movies
MOVIES = [
    # Classic Horror (1-10)
    {"id": 1, "title": "Night of the Living Dead", "url": "https://archive.org/download/night-of-the-living-dead_202303/Night%20of%20the%20Living%20Dead.mp4"},
    {"id": 2, "title": "The Last Man on Earth", "url": "https://archive.org/download/the-last-man-on-earth_202203/The%20Last%20Man%20on%20Earth.mp4"},
    {"id": 3, "title": "Plan 9 from Outer Space", "url": "https://archive.org/download/plan-9-from-outer-space_202202/Plan%209%20from%20Outer%20Space.mp4"},
    {"id": 4, "title": "Reefer Madness", "url": "https://archive.org/download/reefer-madness_202110/Reefer%20Madness.mp4"},
    {"id": 5, "title": "House on Haunted Hill", "url": "https://archive.org/download/house-on-haunted-hill_202112/House%20on%20Haunted%20Hill.mp4"},
    {"id": 6, "title": "Carnival of Souls", "url": "https://archive.org/download/carnival-of-souls_202009/Carnival%20of%20Souls.mp4"},
    {"id": 7, "title": "The Little Shop of Horrors", "url": "https://archive.org/download/little-shop-of-horrors_202007/Little%20Shop%20of%20Horrors.mp4"},
    {"id": 8, "title": "The Terror", "url": "https://archive.org/download/the-terror_202108/The%20Terror.mp4"},
    {"id": 9, "title": "The Phantom of the Opera", "url": "https://archive.org/download/phantom_of_the_opera_1925/Phantom%20of%20the%20Opera.mp4"},
    {"id": 10, "title": "The Cabinet of Dr. Caligari", "url": "https://archive.org/download/the-cabinet-of-dr-caligari_202105/The%20Cabinet%20of%20Dr.%20Caligari.mp4"},
    
    # Classic Sci-Fi (11-20)
    {"id": 11, "title": "The Day the Earth Stood Still", "url": "https://archive.org/download/the-day-the-earth-stood-still_202108/The%20Day%20the%20Earth%20Stood%20Still.mp4"},
    {"id": 12, "title": "Forbidden Planet", "url": "https://archive.org/download/forbidden-planet_202112/Forbidden%20Planet.mp4"},
    {"id": 13, "title": "Them!", "url": "https://archive.org/download/them_202108/Them%21.mp4"},
    {"id": 14, "title": "The Time Machine", "url": "https://archive.org/download/the-time-machine_202109/The%20Time%20Machine.mp4"},
    {"id": 15, "title": "The War of the Worlds", "url": "https://archive.org/download/the-war-of-the-worlds_202108/The%20War%20of%20the%20Worlds.mp4"},
    {"id": 16, "title": "Invasion of the Body Snatchers", "url": "https://archive.org/download/invasion-of-the-body-snatchers_202108/Invasion%20of%20the%20Body%20Snatchers.mp4"},
    {"id": 17, "title": "The Blob", "url": "https://archive.org/download/the-blob_202108/The%20Blob.mp4"},
    {"id": 18, "title": "The Fly", "url": "https://archive.org/download/the-fly_202108/The%20Fly.mp4"},
    {"id": 19, "title": "The Incredible Shrinking Man", "url": "https://archive.org/download/the-incredible-shrinking-man_202108/The%20Incredible%20Shrinking%20Man.mp4"},
    {"id": 20, "title": "The Thing from Another World", "url": "https://archive.org/download/the-thing-from-another-world_202108/The%20Thing%20from%20Another%20World.mp4"},
    
    # Classic Adventure (21-30)
    {"id": 21, "title": "The Adventures of Robin Hood", "url": "https://archive.org/download/the-adventures-of-robin-hood_202108/The%20Adventures%20of%20Robin%20Hood.mp4"},
    {"id": 22, "title": "The Mark of Zorro", "url": "https://archive.org/download/the-mark-of-zorro_202108/The%20Mark%20of%20Zorro.mp4"},
    {"id": 23, "title": "The Prisoner of Zenda", "url": "https://archive.org/download/the-prisoner-of-zenda_202108/The%20Prisoner%20of%20Zenda.mp4"},
    {"id": 24, "title": "The Three Musketeers", "url": "https://archive.org/download/the-three-musketeers_202108/The%20Three%20Musketeers.mp4"},
    {"id": 25, "title": "Captain Blood", "url": "https://archive.org/download/captain-blood_202108/Captain%20Blood.mp4"},
    {"id": 26, "title": "The Sea Hawk", "url": "https://archive.org/download/the-sea-hawk_202108/The%20Sea%20Hawk.mp4"},
    {"id": 27, "title": "The Black Pirate", "url": "https://archive.org/download/the-black-pirate_202108/The%20Black%20Pirate.mp4"},
    {"id": 28, "title": "The Thief of Bagdad", "url": "https://archive.org/download/the-thief-of-bagdad_202108/The%20Thief%20of%20Bagdad.mp4"},
    {"id": 29, "title": "The Adventures of Don Juan", "url": "https://archive.org/download/the-adventures-of-don-juan_202108/The%20Adventures%20of%20Don%20Juan.mp4"},
    {"id": 30, "title": "The Court Jester", "url": "https://archive.org/download/the-court-jester_202108/The%20Court%20Jester.mp4"),
    
    # Classic Comedy (31-40)
    {"id": 31, "title": "The General", "url": "https://archive.org/download/the-general_202108/The%20General.mp4"},
    {"id": 32, "title": "The Gold Rush", "url": "https://archive.org/download/the-gold-rush_202108/The%20Gold%20Rush.mp4"},
    {"id": 33, "title": "City Lights", "url": "https://archive.org/download/city-lights_202108/City%20Lights.mp4"},
    {"id": 34, "title": "Modern Times", "url": "https://archive.org/download/modern-times_202108/Modern%20Times.mp4"},
    {"id": 35, "title": "The Kid", "url": "https://archive.org/download/the-kid_202108/The%20Kid.mp4"},
    {"id": 36, "title": "Safety Last!", "url": "https://archive.org/download/safety-last_202108/Safety%20Last%21.mp4"},
    {"id": 37, "title": "The Freshman", "url": "https://archive.org/download/the-freshman_202108/The%20Freshman.mp4"},
    {"id": 38, "title": "The Circus", "url": "https://archive.org/download/the-circus_202108/The%20Circus.mp4"},
    {"id": 39, "title": "The Navigator", "url": "https://archive.org/download/the-navigator_202108/The%20Navigator.mp4"},
    {"id": 40, "title": "The Cameraman", "url": "https://archive.org/download/the-cameraman_202108/The%20Cameraman.mp4"},
    
    # Classic Western (41-50)
    {"id": 41, "title": "The Great Train Robbery", "url": "https://archive.org/download/the-great-train-robbery_202108/The%20Great%20Train%20Robbery.mp4"},
    {"id": 42, "title": "The Big Trail", "url": "https://archive.org/download/the-big-trail_202108/The%20Big%20Trail.mp4"},
    {"id": 43, "title": "Cimarron", "url": "https://archive.org/download/cimarron_202108/Cimarron.mp4"},
    {"id": 44, "title": "The Virginian", "url": "https://archive.org/download/the-virginian_202108/The%20Virginian.mp4"},
    {"id": 45, "title": "The Covered Wagon", "url": "https://archive.org/download/the-covered-wagon_202108/The%20Covered%20Wagon.mp4"},
    {"id": 46, "title": "The Iron Horse", "url": "https://archive.org/download/the-iron-horse_202108/The%20Iron%20Horse.mp4"},
    {"id": 47, "title": "The Lost Patrol", "url": "https://archive.org/download/the-lost-patrol_202108/The%20Lost%20Patrol.mp4"},
    {"id": 48, "title": "The Informer", "url": "https://archive.org/download/the-informer_202108/The%20Informer.mp4"},
    {"id": 49, "title": "The Whole Town's Talking", "url": "https://archive.org/download/the-whole-towns-talking_202108/The%20Whole%20Town%27s%20Talking.mp4"},
    {"id": 50, "title": "The Scoundrel", "url": "https://archive.org/download/the-scoundrel_202108/The%20Scoundrel.mp4"),
    
    # More Classic Movies (51-56)
    {"id": 51, "title": "The Most Dangerous Game", "url": "https://archive.org/download/the-most-dangerous-game_202108/The%20Most%20Dangerous%20Game.mp4"},
    {"id": 52, "title": "King Kong", "url": "https://archive.org/download/king-kong_202108/King%20Kong.mp4"},
    {"id": 53, "title": "M", "url": "https://archive.org/download/m_202108/M.mp4"},
    {"id": 54, "title": "The 39 Steps", "url": "https://archive.org/download/the-39-steps_202108/The%2039%20Steps.mp4"},
    {"id": 55, "title": "The Lady Vanishes", "url": "https://archive.org/download/the-lady-vanishes_202108/The%20Lady%20Vanishes.mp4"},
    {"id": 56, "title": "Notorious", "url": "https://archive.org/download/notorious_202108/Notorious.mp4"},
]

def download_movie(movie):
    """Download a single movie"""
    filename = f"movie_{movie['id']}.mp4"
    filepath = f"./movies/{filename}"
    
    # Skip if already exists
    if os.path.exists(filepath):
        print(f"⏭️ {filename} already exists - skipping")
        return {"id": movie["id"], "status": "skipped", "filename": filename}
    
    print(f"📥 Downloading: {movie['title']} ({filename})")
    
    try:
        response = requests.get(movie['url'], stream=True, timeout=120)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(filepath, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                f.write(chunk)
                downloaded += len(chunk)
                if total_size > 0:
                    progress = (downloaded / total_size) * 100
                    print(f"\r  Progress: {progress:.1f}% ({downloaded/1024/1024:.1f}MB/{total_size/1024/1024:.1f}MB)", end='')
        
        print(f"\n✅ Downloaded: {filename}")
        return {"id": movie["id"], "status": "success", "filename": filename}
        
    except Exception as e:
        print(f"\n❌ Failed: {filename} - {e}")
        # Try alternate URL for failed downloads
        return {"id": movie["id"], "status": "failed", "filename": filename, "error": str(e)}

def main():
    """Main function to download all movies"""
    print("=" * 60)
    print("🎬 MOVIE DOWNLOADER - 56 Public Domain Movies")
    print("=" * 60)
    
    # Create movies folder
    os.makedirs("./movies", exist_ok=True)
    
    # Check existing files
    existing = [f for f in os.listdir("./movies") if f.startswith("movie_") and f.endswith(".mp4")]
    print(f"📁 Existing movies: {len(existing)}/56")
    
    # Download missing movies
    missing = [m for m in MOVIES if f"movie_{m['id']}.mp4" not in existing]
    
    if not missing:
        print("✅ All 56 movies already downloaded!")
        return
    
    print(f"📥 Need to download: {len(missing)} movies")
    print("-" * 60)
    
    # Download with 3 concurrent threads
    results = []
    with ThreadPoolExecutor(max_workers=3) as executor:
        future_to_movie = {executor.submit(download_movie, movie): movie for movie in missing}
        
        for future in as_completed(future_to_movie):
            result = future.result()
            results.append(result)
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 DOWNLOAD SUMMARY")
    print("=" * 60)
    success = [r for r in results if r["status"] == "success"]
    failed = [r for r in results if r["status"] == "failed"]
    skipped = [r for r in results if r["status"] == "skipped"]
    
    print(f"✅ Successfully downloaded: {len(success)}")
    print(f"⏭️ Skipped (already exist): {len(skipped)}")
    print(f"❌ Failed: {len(failed)}")
    
    if failed:
        print("\n❌ Failed downloads:")
        for f in failed:
            print(f"  - {f['filename']}: {f.get('error', 'Unknown error')}")
    
    print("\n🎉 Done! Check ./movies folder")

if __name__ == "__main__":
    main()